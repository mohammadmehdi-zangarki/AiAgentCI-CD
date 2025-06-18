import axios from 'axios';

// تنظیم baseURL برای APIهای مختلف
const API_URL = process.env.REACT_APP_API_URL || 'http://144.76.160.218:81/api';
const PYTHON_APP_URL = process.env.REACT_APP_PYTHON_APP_URL || process.env.REACT_APP_PYTHON_APP_API_URL || 'http://144.76.160.218:81/api';

// ایجاد نمونه axios با تنظیمات پیش‌فرض
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
});

// ایجاد نمونه axios برای چت
const chatAxiosInstance = axios.create({
  baseURL: PYTHON_APP_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// افزودن interceptor برای افزودن توکن به هدرها
chatAxiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// دریافت لیست منابع داده
export const getDataSources = async () => {
  try {
    console.log('Fetching data sources from:', `${PYTHON_APP_URL}/data_sources/`);
    const response = await chatAxiosInstance.get('/data_sources/');
    console.log('Data sources response structure:', {
      isArray: Array.isArray(response.data),
      hasResultsArray: response.data && Array.isArray(response.data.results),
      hasDataArray: response.data && Array.isArray(response.data.data),
      hasSourcesArray: response.data && Array.isArray(response.data.sources),
      responseKeys: response.data ? Object.keys(response.data) : [],
      fullResponse: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      },
    });

    if (error.response) {
      throw new Error(`خطا در دریافت منابع داده (کد خطا: ${error.response.status})`);
    } else if (error.request) {
      throw new Error('سرور پاسخ نمی‌دهد. لطفاً اتصال اینترنت و سرور را بررسی کنید.');
    } else {
      throw new Error('خطا در ارسال درخواست به سرور');
    }
  }
};

// ارسال سوال به چت‌بات
export const askQuestion = async (question) => {
  try {
    console.log('Sending question to:', `${PYTHON_APP_URL}/ask`);
    const response = await chatAxiosInstance.post('/ask', { question });
    console.log('Chat response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      },
    });

    if (error.response) {
      throw new Error(`خطا در دریافت پاسخ (کد خطا: ${error.response.status})`);
    } else if (error.request) {
      throw new Error('سرور پاسخ نمی‌دهد. لطفاً اتصال اینترنت و سرور را بررسی کنید.');
    } else {
      throw new Error('خطا در ارسال درخواست به سرور');
    }
  }
};

// ارسال درخواست لاگین
export const login = async (email, password) => {
  try {
    console.log('Sending login request to:', `${API_URL}/login`);
    const response = await axiosInstance.post('/login', {
      email,
      password,
    });
    console.log('Login response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      },
    });

    if (error.response) {
      throw new Error(`خطا در ورود به سیستم (کد خطا: ${error.response.status})`);
    } else if (error.request) {
      throw new Error('سرور پاسخ نمی‌دهد. لطفاً اتصال اینترنت و سرور را بررسی کنید.');
    } else {
      throw new Error('خطا در ارسال درخواست به سرور');
    }
  }
};

export const getDomains = async () => {
  try {
    return await axios.get(`${PYTHON_APP_URL}/domains`)
  } catch (err) {
    console.error(err.message)
    return null
  }
}

export const getDocuments = async (manualType = false, page=1,size=10) => {
  const url = 
    manualType ?
      `${PYTHON_APP_URL}/documents/manual?page=${page}&size=${size}`:
      `${PYTHON_APP_URL}/documents?page=${page}&size=${size}`;

  try {
    return await axios.get(url)
  } catch (err) {
    console.error(err.message)
    return null
  }
}

export const getDomainDocuments = async (domain_id, page=1,size=10) => {
  const url = `${PYTHON_APP_URL}/documents/domain/${domain_id}?page=${page}&size=${size}`;
  try {
    return await axios.get(url)
  } catch (err) {
    console.error(err.message)
    return null
  }
}

export const getDocument = async (document_id) => {
  try {
    return await axios.get(`${PYTHON_APP_URL}/documents/${document_id}`);
  } catch (err) {
    console.error('Error fetching document:', err.message);
    throw err;
  }
}

export const toggleDocumentVectorStatus = async (document_id) => {
  try {
    return await axios.post(`${PYTHON_APP_URL}/documents/${document_id}/toggle-vector`);
  } catch (err) {
    console.error('Error fetching document:', err.message);
    throw err;
  }
}

export const crawlUrl = async (url, recursive = false, store_in_vector = false) => {
  try {
    return await axios.post(`${PYTHON_APP_URL}/crawl`, {
      "url" : url,
      "recursive" : recursive,
      "store_in_vector" : store_in_vector
    });
  } catch (err) {
    console.error('Error fetching document:', err.message);
    throw err;
  }
}

export const vectorizeDocument = async (document_id, document) => {
  try {
    return await axios.post(`${PYTHON_APP_URL}/documents/${document_id}/vectorize`, document);
  } catch (err) {
    console.error('Error vectorizing document:', err.message);
    throw err;
  }
}