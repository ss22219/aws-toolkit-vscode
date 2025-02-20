/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import * as path from 'path'
import * as pathutils from '../../../shared/utilities/pathUtils'
import * as testutil from '../../testUtil'
import * as vscode from 'vscode'
import * as fs from 'fs-extra'
import { FakeExtensionContext } from '../../fakeExtensionContext'
import { addInitialLaunchConfiguration } from '../../../lambda/commands/createNewSamApp'
import { LaunchConfiguration } from '../../../shared/debug/launchConfiguration'
import { anything, capture, instance, mock, when } from 'ts-mockito'
import { makeSampleSamTemplateYaml } from '../../shared/cloudformation/cloudformationTestUtils'
import { makeTemporaryToolkitFolder } from '../../../shared/filesystemUtilities'
import { ExtContext } from '../../../shared/extensions'
import {
    AwsSamDebuggerConfiguration,
    TemplateTargetProperties,
} from '../../../shared/sam/debugger/awsSamDebugConfiguration'
import { ext } from '../../../shared/extensionGlobals'

describe('addInitialLaunchConfiguration', function () {
    let mockLaunchConfiguration: LaunchConfiguration
    let tempFolder: string
    let tempTemplate: vscode.Uri
    let fakeWorkspaceFolder: vscode.WorkspaceFolder
    let fakeContext: ExtContext

    beforeEach(async function () {
        mockLaunchConfiguration = mock()
        fakeContext = await FakeExtensionContext.getFakeExtContext()
        tempFolder = await makeTemporaryToolkitFolder()
        tempTemplate = vscode.Uri.file(path.join(tempFolder, 'test.yaml'))

        fakeWorkspaceFolder = {
            uri: vscode.Uri.file(tempFolder),
            name: 'It was me, fakeWorkspaceFolder!',
            index: 0,
        }

        when(mockLaunchConfiguration.getDebugConfigurations()).thenReturn([
            {
                type: 'aws-sam',
                name: 'name',
                request: 'direct-invoke',
                invokeTarget: {
                    target: 'template',
                    templatePath: '${workspaceFolder}/test.yaml',
                    logicalId: 'resource',
                },
            },
        ])
    })

    afterEach(async function () {
        await fs.remove(tempFolder)
        ext.templateRegistry.reset()
    })

    it('produces and returns initial launch configurations', async function () {
        when(mockLaunchConfiguration.addDebugConfigurations(anything())).thenResolve()

        testutil.toFile(makeSampleSamTemplateYaml(true), tempTemplate.fsPath)

        // without runtime
        await ext.templateRegistry.addItemToRegistry(tempTemplate)
        const launchConfigs = await addInitialLaunchConfiguration(
            fakeContext,
            fakeWorkspaceFolder,
            tempTemplate,
            undefined,
            instance(mockLaunchConfiguration)
        )

        // eslint-disable-next-line @typescript-eslint/unbound-method
        const [arg] = capture(mockLaunchConfiguration.addDebugConfigurations).last()
        assert.ok(
            pathutils.areEqual(
                fakeWorkspaceFolder.uri.fsPath,
                (arg[0].invokeTarget as TemplateTargetProperties).templatePath,
                tempTemplate.fsPath,
                true
            )
        )
        assert.ok(launchConfigs)
        const matchingConfigs = launchConfigs?.filter(config => {
            return pathutils.areEqual(
                fakeWorkspaceFolder.uri.fsPath,
                (config.invokeTarget as TemplateTargetProperties).templatePath,
                tempTemplate.fsPath,
                true
            )
        })
        assert.ok(matchingConfigs)
        assert.strictEqual(matchingConfigs!.length, 1)
    })

    it('produces and returns initial launch configurations with runtime', async function () {
        when(mockLaunchConfiguration.addDebugConfigurations(anything())).thenResolve()

        testutil.toFile(makeSampleSamTemplateYaml(true), tempTemplate.fsPath)

        // without runtime
        await ext.templateRegistry.addItemToRegistry(tempTemplate)
        const launchConfigs = (await addInitialLaunchConfiguration(
            fakeContext,
            fakeWorkspaceFolder,
            tempTemplate,
            'someruntime',
            instance(mockLaunchConfiguration)
        )) as AwsSamDebuggerConfiguration[]

        // eslint-disable-next-line @typescript-eslint/unbound-method
        const [arg] = capture(mockLaunchConfiguration.addDebugConfigurations).last()
        assert.ok(
            pathutils.areEqual(
                fakeWorkspaceFolder.uri.fsPath,
                (arg[0].invokeTarget as TemplateTargetProperties).templatePath,
                tempTemplate.fsPath,
                true
            )
        )
        assert.ok(launchConfigs)
        const matchingConfigs = launchConfigs?.filter(config => {
            return (
                pathutils.areEqual(
                    fakeWorkspaceFolder.uri.fsPath,
                    (config.invokeTarget as TemplateTargetProperties).templatePath,
                    tempTemplate.fsPath,
                    true
                ) && config.lambda?.runtime === 'someruntime'
            )
        })
        assert.ok(matchingConfigs)
        assert.strictEqual(matchingConfigs!.length, 1)
    })

    it('returns a blank array if it does not match any launch configs', async function () {
        when(mockLaunchConfiguration.addDebugConfigurations(anything())).thenResolve()

        testutil.toFile(makeSampleSamTemplateYaml(true), tempTemplate.fsPath)

        await ext.templateRegistry.addItemToRegistry(tempTemplate)
        const launchConfigs = await addInitialLaunchConfiguration(
            fakeContext,
            fakeWorkspaceFolder,
            vscode.Uri.file(path.join(tempFolder, 'thisAintIt.yaml')),
            undefined,
            instance(mockLaunchConfiguration)
        )
        assert.deepStrictEqual(launchConfigs, [])
    })
})
