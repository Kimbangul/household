import { Pressable, ScrollView, TextInput } from 'react-native';
import styled from 'styled-components/native';

// Shared across every screen/form: only components whose CSS is byte-for-byte
// identical in at least two files live here. A component that looks similar
// but differs even slightly (margin, alignment) stays local to its file —
// forcing those together would either change one screen's appearance or
// require prop-driven overrides for a one-off difference, which is worse
// than the duplication it would remove.

export const Screen = styled(ScrollView)`
  background-color: ${(props) => props.theme.background};
`;

export const Heading = styled.Text`
  font-size: 20px;
  color: ${(props) => props.theme.text};
  font-family: ${(props) => props.theme.fontSemiBold};
`;

export const SectionHeading = styled(Heading)`
  margin-top: 24px;
  margin-bottom: 8px;
`;

export const FieldLabel = styled.Text`
  font-size: 14px;
  margin-top: 12px;
  color: ${(props) => props.theme.text};
  font-family: ${(props) => props.theme.fontSemiBold};
`;

export const FieldInput = styled(TextInput)`
  border-width: 1px;
  border-radius: 14px;
  padding: 10px;
  margin-top: 4px;
  border-color: ${(props) => props.theme.border};
  color: ${(props) => props.theme.text};
  font-family: ${(props) => props.theme.fontRegular};
`;

export const MemoInput = styled(FieldInput)`
  min-height: 60px;
  text-align-vertical: top;
`;

export const FieldError = styled.Text`
  margin-top: 4px;
  color: ${(props) => props.theme.danger};
  font-family: ${(props) => props.theme.fontRegular};
`;

export const EmptyText = styled.Text`
  color: ${(props) => props.theme.textMuted};
  font-family: ${(props) => props.theme.fontRegular};
`;

export const SubmitButton = styled(Pressable)`
  margin-top: 24px;
  border-radius: 14px;
  padding-vertical: 14px;
  align-items: center;
  background-color: ${(props) => props.theme.primary};
`;

export const SubmitButtonText = styled.Text`
  color: ${(props) => props.theme.onPrimary};
  font-size: 16px;
  font-family: ${(props) => props.theme.fontSemiBold};
`;

export const StatusSuccessText = styled.Text`
  margin-top: 12px;
  text-align: center;
  color: ${(props) => props.theme.success};
  font-family: ${(props) => props.theme.fontRegular};
`;

export const StatusErrorText = styled.Text`
  margin-top: 12px;
  text-align: center;
  color: ${(props) => props.theme.danger};
  font-family: ${(props) => props.theme.fontRegular};
`;
