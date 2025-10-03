import { useState, useEffect } from 'react';
import { Form, Button } from 'antd';

const SubmitButton = ({ form }) => {
    const [submittable, setSubmittable] = useState(false);

    // сбор всех values
    const values = Form.useWatch([], form);

    useEffect(() => {
      form
        .validateFields({
          validateOnly: true,
        })
        .then(
          () => {
            setSubmittable(true);
          },
          () => {
            setSubmittable(false);
          },
        );
    }, [values]);

    return (
      <Button type="primary" htmlType="submit" disabled={!submittable}>
        Добавить
      </Button>
    );
  };

export default SubmitButton;