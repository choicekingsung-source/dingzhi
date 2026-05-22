import React from 'react';
import { Col, Row } from 'antd';
import DataPage from './DataPage';
import TrendPage from './TrendPage';

function DashboardPage() {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={16}>
        <DataPage />
      </Col>
      <Col xs={24} lg={8}>
        <TrendPage />
      </Col>
    </Row>
  );
}

export default DashboardPage;