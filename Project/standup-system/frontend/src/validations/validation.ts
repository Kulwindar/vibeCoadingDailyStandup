import * as yup from 'yup';

export const standupSchema = yup.object().shape({
  member_email: yup.string().email('Invalid email').required('Please select yourself from the roster list'),
  yesterday: yup.string().trim().required('Please describe what you completed yesterday'),
  today: yup.string().trim().required('Please describe what you plan to work on today'),
  blockers: yup.string().trim().required('Please state any blockers (or enter "None")')
});
