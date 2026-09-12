import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE = 'http://localhost:8000/api';

// Async thunk for sending prompts to AI Copilot
export const sendCopilotPrompt = createAsyncThunk(
  'complaint/sendCopilotPrompt',
  async ({ prompt, complaintId, currentForm }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          complaint_id: complaintId,
          current_form: currentForm
        })
      });
      if (!res.ok) throw new Error('Copilot request failed');
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Async thunk for uploading document (PDF/Email text)
export const uploadComplaintDoc = createAsyncThunk(
  'complaint/uploadComplaintDoc',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Document extraction failed');
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Async thunk for saving logged complaint to DB
export const saveComplaintToDb = createAsyncThunk(
  'complaint/saveComplaintToDb',
  async ({ formData, riskAssessment, completenessCheck }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_data: formData,
          risk_assessment: riskAssessment,
          completeness_check: completenessCheck
        })
      });
      if (!res.ok) throw new Error('Failed to save complaint');
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Async thunk for fetching all logged complaints
export const fetchComplaints = createAsyncThunk(
  'complaint/fetchComplaints',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/complaints`);
      if (!res.ok) throw new Error('Failed to fetch complaints');
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Async thunk for clearing all logged complaints
export const clearAllComplaints = createAsyncThunk(
  'complaint/clearAllComplaints',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/complaints`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to clear complaints');
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);



const initialForm = {
  product_name: '',
  product_type: 'FDF',
  dosage_form: '',
  strength: '',
  batch_number: '',
  quantity_affected: '',
  reporter_name: '',
  reporter_type: '',
  reporter_contact: '',
  date_received: '',
  complaint_description: ''
};

const complaintSlice = createSlice({
  name: 'complaint',
  initialState: {
    activeTab: 'log', // 'log' | 'dashboard'
    currentForm: initialForm,
    riskAssessment: null,
    completenessCheck: null,
    duplicateCheck: null,
    activeComplaintId: null,
    complaintList: [],
    loading: false,
    error: null,
    successMessage: null
  },
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    updateFormField: (state, action) => {
      const { field, value } = action.payload;
      state.currentForm[field] = value;
    },
    resetForm: (state) => {
      state.currentForm = initialForm;
      state.riskAssessment = null;
      state.completenessCheck = null;
      state.duplicateCheck = null;
      state.activeComplaintId = null;
    },
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Copilot Prompt
      .addCase(sendCopilotPrompt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendCopilotPrompt.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        state.currentForm = { ...state.currentForm, ...data.form_data };
        state.riskAssessment = data.risk_assessment;
        state.completenessCheck = data.completeness_check;
        state.duplicateCheck = data.duplicate_check;
      })
      .addCase(sendCopilotPrompt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to process AI prompt';
      })
      // Upload Document
      .addCase(uploadComplaintDoc.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadComplaintDoc.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        state.currentForm = { ...state.currentForm, ...data.form_data };
        state.riskAssessment = data.risk_assessment;
        state.completenessCheck = data.completeness_check;
        state.duplicateCheck = data.duplicate_check;
      })
      .addCase(uploadComplaintDoc.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to parse document';
      })
      // Save Complaint
      .addCase(saveComplaintToDb.fulfilled, (state, action) => {
        state.successMessage = `Complaint logged successfully #${action.payload.complaint_number}`;
        state.complaintList.unshift(action.payload);
      })
      // Fetch Complaints List
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.complaintList = action.payload;
      })
      // Clear All Complaints
      .addCase(clearAllComplaints.fulfilled, (state) => {
        state.complaintList = [];
        state.successMessage = "All complaints cleared successfully";
      });
  }
});

export const { setActiveTab, updateFormField, resetForm, clearMessages } = complaintSlice.actions;
export default complaintSlice.reducer;
