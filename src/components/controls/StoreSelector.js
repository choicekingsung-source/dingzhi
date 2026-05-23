import React from 'react';
import { Checkbox, Empty, Space, Typography } from 'antd';

function StoreSelector({ stores, selectedStores, onChange }) {
  if (!stores.length) {
    return <Empty description="上传数据后可按店铺筛选图表" />;
  }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Typography.Text strong>店铺勾选</Typography.Text>
      <Checkbox.Group value={selectedStores} onChange={onChange} style={{ width: '100%' }}>
        <Space wrap>
          {stores.map((store) => (
            <Checkbox key={store} value={store}>
              {store}
            </Checkbox>
          ))}
        </Space>
      </Checkbox.Group>
    </Space>
  );
}

export default StoreSelector;
