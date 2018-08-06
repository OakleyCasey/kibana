/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  EuiBasicTable
} from '@elastic/eui';

export function LatestActive({ latestActive }) {
  const rangeMap = {
    'last1m': 'Last 1 minute',
    'last5m': 'Last 5 minutes',
    'last20m': 'Last 20 minutes',
    'last1h': 'Last 1 hour',
    'last1d': 'Last 1 day',
  };

  const activity = latestActive.map(({ range, count }) => ({
    range: rangeMap[range],
    count,
  }));

  return (
    <EuiBasicTable
      items={activity}
      columns={[
        {
          field: 'range',
        },
        {
          field: 'count',
          dataType: 'number',
        }
      ]}
    />
  );
}

LatestActive.propTypes = {
  latestActive: PropTypes.arrayOf(PropTypes.shape({
    range: PropTypes.string.isRequired,
    count: PropTypes.number.isRequired,
  })).isRequired
};
