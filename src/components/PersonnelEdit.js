import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const PersonnelEdit = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    employee_id: '',
    role_id: '',
    email: '',
    phone: ''
  });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    fetchRoles();
  }, [id]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8000/api/personnel/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const { name, employee_id, role_id, email, phone } = response.data;
      setFormData({
        name,
        employee_id,
        role_id,
        email,
        phone
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching personnel:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/roles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setRoles(response.data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8000/api/personnel/${id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      navigate('/personnel');
    } catch (error) {
      console.error('Error updating personnel:', error);
      alert('خطا در بروزرسانی پرسنل');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">ویرایش پرسنل</h1>
          <button
            onClick={() => navigate('/personnel')}
            className="btn bg-gray-500 hover:bg-gray-600 text-white"
          >
            بازگشت
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <label className="form-label">نام</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">کد پرسنلی</label>
            <input
              type="text"
              name="employee_id"
              value={formData.employee_id}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">سمت</label>
            <select
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">انتخاب کنید</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.display_name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">ایمیل</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">تلفن</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn bg-blue-600 hover:bg-blue-700 text-white"
              disabled={saving}
            >
              {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonnelEdit; 