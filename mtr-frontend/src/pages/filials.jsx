import { Divider, Form, Input, Typography, Popconfirm } from 'antd';
import SubmitButton from '../components/button/Button';
import EditableCell from '../components/editTableCell/EditTableCell';
import { api } from '../utils/ApiDirectories'
import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import TableDirectories from '../components/dataTable/DataTable';

const Filials = () => {
  const [formNameFilial] = Form.useForm(); //встроенный хук ANTD для формы при добавленнии нового филиала
  const [form] = Form.useForm(); //встроенный хук ANTD для формы при изменении филиала
  const [dataFilials, setDataFilials] = useState([]); //филиалы
  const [editingKey, setEditingKey] = useState('');
  const isEditing = (record) => record.key === editingKey;

  // вывод ошибок в консоль в случае пустых input,
  // но тут кнопка не активна пока не будет заполнены все input
  const onFinishFailed = (errorInfo) => {
    console.error('Failed', errorInfo);
  }

  // запрос к бекенду для добавления нового филиала
  const onFinish = useCallback((values) => {
    api.createFilial(values)
      .then(res => {
        getFilials();
      })
  }, []);

  // передаем значение из таблицы в input для редактирования и сохраняем key выбранной строки
  const edit = (record) => {
    form.setFieldsValue({
      name: '',
      ...record,
    });
    setEditingKey(record.key);
  };

   // убираем удаленную строку и делаем запрос к бекенду для удаления выбранной строки
  const handleDelete = (key) => {
    const newData = dataFilials.filter((item) => item.key !== key);
    const deleteData = dataFilials.filter((item) => item.key === key);
    setDataFilials(newData);
    api.deleteFilial(deleteData)
      .then(res => {
        getFilials();
      })
  };

  // отменяем редактирования и сбрасывает key выбранной строки
  const cancel = () => {
    setEditingKey('');
  };

  // сохраняем новые данные в таблицу и делаем запрос на бекенд для внесения изменений в БД
  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const newData = [...dataFilials];
      const index = newData.findIndex((item) => key === item.key);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, {
          ...item,
          ...row,
        });
        setDataFilials(newData);
        setEditingKey('');
        api.patchFilial(newData[index]);
      } else {
        newData.push(row);
        setDataFilials(newData);
        setEditingKey('');
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  //параметры самой таблицы, кол-во колонок, их названия и другое
  const columns = [
    {
      title: '#',
      dataIndex: 'number',
      key: 'number',
    },
    {
      title: 'Название филиала',
      dataIndex: 'nameFilial',
      key: 'nameFilial',
      editable: true,
    },
    {
      title: 'Операции',
      dataIndex: 'operation',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <Typography.Link
              onClick={() => cancel()}
              style={{
                marginRight: 8,
              }}
            >
              Отмена
            </Typography.Link>
            <Popconfirm title="Подтвердите изменение?" onConfirm={() => save(record.key)}>
              <Typography.Link>
                Сохранить
              </Typography.Link>
            </Popconfirm>
          </span>
        ) : (
          <>
            <Typography.Link disabled={editingKey !== ''} onClick={() => edit(record)}>
              Редактировать
            </Typography.Link> &nbsp;
            <Popconfirm title="Подтвердите удаление?" onConfirm={() => handleDelete(record.key)}>
              <Typography.Link disabled={editingKey !== ''} >
                Удалить
              </Typography.Link>
            </Popconfirm>
          </>
        );
      },
    },
  ];

  //параметры самой таблицы, с учетом редактирования
  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  // запрос на бекенд для выгрузки всех отделов из БД
  const getFilials = () => {
    api.getFilialsAll()
      .then(res => {
        const formattedFilials = res.map((item, n) => {
          return {
            id: item.id,
            nameFilial: item.nameFilial,
            number: n+1,
            key: `${uuidv4()}`,
          }
        })
        setDataFilials(formattedFilials);
      })
      .catch((err) => console.log(err));
  }

  useEffect(() => {
    getFilials();
  }, [])

  return (
    <>
      <Divider orientation="left">Филиалы</Divider>
      <Form
        form={formNameFilial}
        name="createFilial"
        labelCol={{
          span: 4,
        }}
        wrapperCol={{
          span: 14,
        }}

        style={{
          maxWidth: 600,
        }}
        initialValues={{
          remember: true,
        }}
        autoComplete='off'
        onFinishFailed={onFinishFailed}
        onFinish={onFinish}
      >

        <Form.Item
          label="Филиал"
          name='nameFilial'
          rules={[{ required: true, message: 'Введите название филиала' }]}
        >
          <Input placeholder='Название филиала'></Input>
        </Form.Item>

        <Form.Item wrapperCol={{
          offset: 4,
          span: 14,
        }}>
           <SubmitButton form={formNameFilial} />
        </Form.Item>
      </Form>
      <TableDirectories
        dataSource={dataFilials}
        columns={mergedColumns}
        editableCell={EditableCell}
        cancel={cancel}
        form={form}
      />
     </>
  )
}

export default Filials;