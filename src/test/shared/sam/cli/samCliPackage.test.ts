/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert'
import { runSamCliPackage, SamCliPackageParameters } from '../../../../shared/sam/cli/samCliPackage'
import { getTestLogger } from '../../../globalSetup.test'
import { assertThrowsError } from '../../utilities/assertUtils'
import { assertArgNotPresent, assertArgsContainArgument, MockSamCliProcessInvoker } from './samCliTestUtils'
import {
    assertErrorContainsBadExitMessage,
    assertLogContainsBadExitInformation,
    BadExitCodeSamCliProcessInvoker,
} from './testSamCliProcessInvoker'

describe('SamCliPackageInvocation', async function () {
    let invokeCount: number
    const packageParameters: SamCliPackageParameters = {
        sourceTemplateFile: 'template',
        destinationTemplateFile: 'output',
        environmentVariables: {},
        region: 'region',
        s3Bucket: 'bucket',
    }

    beforeEach(function () {
        invokeCount = 0
    })

    it('includes a template, s3 bucket, output template file, and region', async function () {
        const invoker = new MockSamCliProcessInvoker(args => {
            invokeCount++
            assertArgsContainArgument(args, '--template-file', 'template')
            assertArgsContainArgument(args, '--s3-bucket', 'bucket')
            assertArgsContainArgument(args, '--output-template-file', 'output')
            assertArgsContainArgument(args, '--region', 'region')
            assertArgNotPresent(args, '--image-repository')
        })

        await runSamCliPackage(packageParameters, invoker)

        assert.strictEqual(invokeCount, 1, 'Unexpected invoke count')
    })

    it('includes a template, s3 bucket, output template file, region, and repo', async function () {
        const invoker = new MockSamCliProcessInvoker(args => {
            invokeCount++
            assertArgsContainArgument(args, '--template-file', 'template')
            assertArgsContainArgument(args, '--s3-bucket', 'bucket')
            assertArgsContainArgument(args, '--output-template-file', 'output')
            assertArgsContainArgument(args, '--region', 'region')
            assertArgsContainArgument(args, '--image-repository', 'ecrRepo')
        })

        await runSamCliPackage({ ...packageParameters, ecrRepo: 'ecrRepo' }, invoker)

        assert.strictEqual(invokeCount, 1, 'Unexpected invoke count')
    })

    it('throws on unexpected exit code', async function () {
        const badExitCodeProcessInvoker = new BadExitCodeSamCliProcessInvoker({})

        const error = await assertThrowsError(async () => {
            await runSamCliPackage(packageParameters, badExitCodeProcessInvoker)
        }, 'Expected an error to be thrown')

        assertErrorContainsBadExitMessage(error, badExitCodeProcessInvoker.error.message)
        await assertLogContainsBadExitInformation(
            getTestLogger(),
            badExitCodeProcessInvoker.makeChildProcessResult(),
            0
        )
    })
})
