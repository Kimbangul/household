import { Pressable } from 'react-native';
import styled from 'styled-components/native';

import { FieldLabel } from '../theme/styledPrimitives';

// Shared between ExpenseEditRow and IncomeEntryEditRow: the parts of their
// inline expand-to-edit UI that are byte-for-byte identical. Each row's
// collapsed summary line (item/meta/amount) stays local to its own file,
// since ExpenseEditRow's needs a standalone-vs-compact variant that
// IncomeEntryEditRow (always compact) doesn't.

export const RowMain = styled.View`
  flex-shrink: 1;
  flex-grow: 1;
`;

export const MetaText = styled.Text`
  font-size: 12px;
  margin-top: 2px;
  color: ${(props) => props.theme.textMuted};
  font-family: ${(props) => props.theme.fontRegular};
`;

export const EditForm = styled.View`
  padding-vertical: 12px;
  gap: 4px;
`;

// The edit form sits inside an already-padded row, so it needs a tighter top
// margin (8px) than the shared FieldLabel's screen-level default (12px).
export const CompactFieldLabel = styled(FieldLabel)`
  margin-top: 8px;
`;

export const RowStatusSuccessText = styled.Text`
  margin-top: 8px;
  color: ${(props) => props.theme.success};
  font-family: ${(props) => props.theme.fontRegular};
`;

export const ActionRow = styled.View`
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
`;

export const SaveButton = styled(Pressable)`
  flex: 1;
  border-radius: 14px;
  padding-vertical: 14px;
  align-items: center;
  background-color: ${(props) => props.theme.primary};
`;

export const SaveButtonText = styled.Text`
  font-size: 16px;
  color: ${(props) => props.theme.onPrimary};
  font-family: ${(props) => props.theme.fontSemiBold};
`;

export const DeleteButton = styled(Pressable)`
  flex: 1;
  border-width: 1px;
  border-radius: 14px;
  padding-vertical: 14px;
  align-items: center;
  background-color: ${(props) => props.theme.background};
  border-color: ${(props) => props.theme.danger};
`;

export const DeleteButtonText = styled.Text`
  font-size: 16px;
  color: ${(props) => props.theme.danger};
  font-family: ${(props) => props.theme.fontSemiBold};
`;
