/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { ServiceConfigurationOptions } from 'aws-sdk/lib/service'
import { env, version, workspace } from 'vscode'
import { AwsContext } from './awsContext'
import { pluginVersion } from './extensionUtilities'


export interface AWSClientBuilder {
    createAndConfigureServiceClient<T>(
        awsServiceFactory: (options: ServiceConfigurationOptions) => T,
        awsServiceOpts?: ServiceConfigurationOptions,
        region?: string,
        addUserAgent?: boolean
    ): Promise<T>
}

export class DefaultAWSClientBuilder implements AWSClientBuilder {
    private readonly _awsContext: AwsContext

    public constructor(awsContext: AwsContext) {
        this._awsContext = awsContext
    }

    // centralized construction of transient AWS service clients, allowing us
    // to customize requests and/or user agent
    public async createAndConfigureServiceClient<T>(
        awsServiceFactory: (options: ServiceConfigurationOptions) => T,
        awsServiceOpts?: ServiceConfigurationOptions,
        region?: string,
        addUserAgent: boolean = true
    ): Promise<T> {
        if (!awsServiceOpts) {
            awsServiceOpts = {}
        }

        if (!awsServiceOpts.credentials) {
            awsServiceOpts.credentials = await this._awsContext.getCredentials()
        }

        if (!awsServiceOpts.region && region) {
            awsServiceOpts.region = region
        }

        if (!awsServiceOpts.customUserAgent && addUserAgent) {
            const platformName = env.appName.replace(/\s/g, '-')
            awsServiceOpts.customUserAgent = `AWS-Toolkit-For-VSCode/${pluginVersion} ${platformName}/${version}`
        }
        
        var endpoint = workspace.getConfiguration('aws').get<string>('endpoint')
        if(endpoint)
            awsServiceOpts.endpoint = endpoint
        return awsServiceFactory(awsServiceOpts)
    }
}
