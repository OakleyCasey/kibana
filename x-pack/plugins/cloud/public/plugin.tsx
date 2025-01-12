/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { FC } from 'react';
import type { CoreSetup, CoreStart, Plugin, PluginInitializerContext } from '@kbn/core/public';

import { registerCloudDeploymentIdAnalyticsContext } from '../common/register_cloud_deployment_id_analytics_context';
import { getIsCloudEnabled } from '../common/is_cloud_enabled';
import { ELASTIC_SUPPORT_LINK, CLOUD_SNAPSHOTS_PATH } from '../common/constants';
import { getFullCloudUrl } from './utils';

export interface CloudConfigType {
  id?: string;
  cname?: string;
  base_url?: string;
  profile_url?: string;
  deployment_url?: string;
  organization_url?: string;
  full_story: {
    enabled: boolean;
    org_id?: string;
    eventTypesAllowlist?: string[];
  };
}

export interface CloudStart {
  /**
   * A React component that provides a pre-wired `React.Context` which connects components to Cloud services.
   */
  CloudContextProvider: FC<{}>;
  /**
   * `true` when Kibana is running on Elastic Cloud.
   */
  isCloudEnabled: boolean;
  /**
   * Cloud ID. Undefined if not running on Cloud.
   */
  cloudId?: string;
  /**
   * The full URL to the deployment management page on Elastic Cloud. Undefined if not running on Cloud.
   */
  deploymentUrl?: string;
  /**
   * The full URL to the user profile page on Elastic Cloud. Undefined if not running on Cloud.
   */
  profileUrl?: string;
  /**
   * The full URL to the organization management page on Elastic Cloud. Undefined if not running on Cloud.
   */
  organizationUrl?: string;
}

export interface CloudSetup {
  cloudId?: string;
  cname?: string;
  baseUrl?: string;
  deploymentUrl?: string;
  profileUrl?: string;
  organizationUrl?: string;
  snapshotsUrl?: string;
  isCloudEnabled: boolean;
  registerCloudService: (contextProvider: FC) => void;
}

interface CloudUrls {
  deploymentUrl?: string;
  profileUrl?: string;
  organizationUrl?: string;
  snapshotsUrl?: string;
}

export class CloudPlugin implements Plugin<CloudSetup> {
  private readonly config: CloudConfigType;
  private readonly isCloudEnabled: boolean;
  private readonly contextProviders: FC[] = [];

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.config = this.initializerContext.config.get<CloudConfigType>();
    this.isCloudEnabled = getIsCloudEnabled(this.config.id);
  }

  public setup(core: CoreSetup): CloudSetup {
    registerCloudDeploymentIdAnalyticsContext(core.analytics, this.config.id);

    const { id, cname, base_url: baseUrl } = this.config;

    return {
      cloudId: id,
      cname,
      baseUrl,
      ...this.getCloudUrls(),
      isCloudEnabled: this.isCloudEnabled,
      registerCloudService: (contextProvider) => {
        this.contextProviders.push(contextProvider);
      },
    };
  }

  public start(coreStart: CoreStart): CloudStart {
    coreStart.chrome.setHelpSupportUrl(ELASTIC_SUPPORT_LINK);

    // Nest all the registered context providers under the Cloud Services Provider.
    // This way, plugins only need to require Cloud's context provider to have all the enriched Cloud services.
    const CloudContextProvider: FC = ({ children }) => {
      return (
        <>
          {this.contextProviders.reduce(
            (acc, ContextProvider) => (
              <ContextProvider> {acc} </ContextProvider>
            ),
            children
          )}
        </>
      );
    };

    const { deploymentUrl, profileUrl, organizationUrl } = this.getCloudUrls();

    return {
      CloudContextProvider,
      isCloudEnabled: this.isCloudEnabled,
      cloudId: this.config.id,
      deploymentUrl,
      profileUrl,
      organizationUrl,
    };
  }

  public stop() {}

  private getCloudUrls(): CloudUrls {
    const {
      profile_url: profileUrl,
      organization_url: organizationUrl,
      deployment_url: deploymentUrl,
      base_url: baseUrl,
    } = this.config;

    const fullCloudDeploymentUrl = getFullCloudUrl(baseUrl, deploymentUrl);
    const fullCloudProfileUrl = getFullCloudUrl(baseUrl, profileUrl);
    const fullCloudOrganizationUrl = getFullCloudUrl(baseUrl, organizationUrl);
    const fullCloudSnapshotsUrl = `${fullCloudDeploymentUrl}/${CLOUD_SNAPSHOTS_PATH}`;

    return {
      deploymentUrl: fullCloudDeploymentUrl,
      profileUrl: fullCloudProfileUrl,
      organizationUrl: fullCloudOrganizationUrl,
      snapshotsUrl: fullCloudSnapshotsUrl,
    };
  }
}
