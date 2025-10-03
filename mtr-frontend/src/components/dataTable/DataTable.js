import { Form, Layout, Table } from 'antd';

const TableDirectories = ({dataSource, columns, cancel, editableCell, form}) => {
  return (
    <>
      <Layout style={{ padding: '0 24px 24px' }}>
        <Form form={form} component={false}>
          <Table
            components={{
              body: {
                cell: editableCell,
              },
            }}
            bordered
            dataSource={dataSource}
            columns={columns}
            pagination={{
              onChange: cancel,
            }}
          />
        </Form >
      </Layout >
    </>
  )
}

export default TableDirectories;