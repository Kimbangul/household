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
  line-height: 16px;
  margin-top: 4px;
  color: ${(props) => props.theme.textMuted};
  font-family: ${(props) => props.theme.fontRegular};
`;

export const EditForm = styled.View`
  padding-vertical: 16px;
  gap: 6px;
`;

// The edit form sits inside an already-padded row, so it needs a tighter top
// margin (10px) than the shared FieldLabel's screen-level default (12px).
export const CompactFieldLabel = styled(FieldLabel)`
  margin-top: 10px;
`;

export const RowStatusSuccessText = styled.Text`
  margin-top: 10px;
  color: ${(props) => props.theme.success};
  font-family: ${(props) => props.theme.fontRegular};
`;

export const ActionRow = styled.View`
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
`;

export const SaveButton = styled(Pressable)`
  flex: 1;
  border-radius: 15px;
  padding-vertical: 14px;
  align-items: center;
  background-color: ${(props) => props.theme.primary};
`;

export const SaveButtonText = styled.Text`
  font-size: 16px;
  line-height: 24px;
  color: ${(props) => props.theme.onPrimary};
  font-family: ${(props) => props.theme.fontMedium};
`;

// Matches the design system's "Button / Ghost" style: no border, white/card
// background, colored label text only.
export const DeleteButton = styled(Pressable)`
  flex: 1;
  border-radius: 15px;
  padding-vertical: 14px;
  align-items: center;
  background-color: ${(props) => props.theme.card};
`;

export const DeleteButtonText = styled.Text`
  font-size: 16px;
  line-height: 24px;
  color: ${(props) => props.theme.danger};
  font-family: ${(props) => props.theme.fontMedium};
`;
