import React from 'react';
import { Col, Row } from 'antd';
import DataPage from './DataPage';

function DashboardPage() {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <DataPage />
      </Col>
    </Row>
  );
}

export default DashboardPage;