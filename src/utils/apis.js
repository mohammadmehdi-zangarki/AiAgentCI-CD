import axios from '../contexts/axios';

// API Base URL
const BASE_URL = process.env.REACT_APP_PYTHON_APP_API_URL;

// Workflow Endpoints
export const workflowEndpoints = {
  // Get workflow by ID
  getWorkflow: async (workflowId) => {
    try {
      const response = await axios.get(`${BASE_URL}/workflows/${workflowId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching workflow:', error);
      throw error;
    }
  },

  // Create new workflow
  createWorkflow: async (workflowData) => {
    try {
      const response = await axios.post(`${BASE_URL}/workflows`, workflowData);
      return response.data;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  },

  // Update existing workflow
  updateWorkflow: async (workflowId, workflowData) => {
    try {
      const response = await axios.put(`${BASE_URL}/workflows/${workflowId}`, workflowData);
      return response.data;
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw error;
    }
  },

  // Delete workflow
  deleteWorkflow: async (workflowId) => {
    try {
      const response = await axios.delete(`${BASE_URL}/workflows/${workflowId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw error;
    }
  },

  // List all workflows
  listWorkflows: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/workflows`);
      return response.data;
    } catch (error) {
      console.error('Error listing workflows:', error);
      throw error;
    }
  }
};

export const getVersion = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/version`);
    return response.data;
  } catch (error) {
    console.error('Error get version:', error);
    throw error;
  }
}

// Instruction Endpoints
export const instructionEndpoints = {
  // Get instruction by ID
  getInstruction: async (instructionId) => {
    try {
      const response = await axios.get(`${BASE_URL}/instructions/${instructionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching instruction:', error);
      throw error;
    }
  },

  // Create new instruction
  createInstruction: async (instructionData) => {
    try {
      const response = await axios.post(`${BASE_URL}/instructions/`, instructionData);
      return response.data;
    } catch (error) {
      console.error('Error creating instruction:', error);
      throw error;
    }
  },

  // Update existing instruction
  updateInstruction: async (instructionId, instructionData) => {
    try {
      const response = await axios.put(`${BASE_URL}/instructions/${instructionId}`, instructionData);
      return response.data;
    } catch (error) {
      console.error('Error updating instruction:', error);
      throw error;
    }
  },

  // Delete instruction
  deleteInstruction: async (instructionId) => {
    try {
      const response = await axios.delete(`${BASE_URL}/instructions/${instructionId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting instruction:', error);
      throw error;
    }
  },

  // List all instructions
  listInstructions: async (page = 1) => {
    try {
      const response = await axios.get(`${BASE_URL}/instructions/?page=${page}`);
      return response.data;
    } catch (error) {
      console.error('Error listing instructions:', error);
      throw error;
    }
  }
};

export const aiFunctionsEndpoints = {
  getFunctionsMap: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/ai-functions/map`);
      return response.data;
    } catch (error) {
      console.error('Error fetching AI functions:', error);
      throw error;
    }
  }
};

// You can add more endpoint categories here
// For example:
// export const userEndpoints = { ... }
// export const authEndpoints = { ... }
