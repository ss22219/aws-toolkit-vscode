/*!
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { logAndThrowIfUnexpectedExitCode } from '../../../../shared/sam/cli/samCliInvokerUtils'
import { getTestLogger } from '../../../globalSetup.test'
import { assertThrowsError } from '../../utilities/assertUtils'
import { assertErrorContainsBadExitMessage, assertLogContainsBadExitInformation } from './testSamCliProcessInvoker'

describe('logAndThrowIfUnexpectedExitCode', async function () {
    it('does not throw on expected exit code', async function () {
        logAndThrowIfUnexpectedExitCode(
            {
                exitCode: 123,
                error: undefined,
                stderr: '',
                stdout: '',
            },
            123
        )
    })

    it('throws on unexpected exit code', async function () {
        const exitError = new Error('bad result')
        const childProcessResult = {
            exitCode: 123,
            error: exitError,
            stderr: 'stderr text',
            stdout: 'stdout text',
        }

        const error = await assertThrowsError(async () => {
            logAndThrowIfUnexpectedExitCode(childProcessResult, 456)
        }, 'Expected an error to be thrown')

        assertErrorContainsBadExitMessage(error, exitError.message)
        await assertLogContainsBadExitInformation(getTestLogger(), childProcessResult, 456)
    })
})
