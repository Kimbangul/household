import { Pressable } from 'react-native';
import styled from 'styled-components/native';

import { Card, FieldLabel } from '../theme/styledPrimitives';

// Shared between ExpenseEditRow and IncomeEntryEditRow: the parts of their
// inline expand-to-edit UI that are byte-for-byte identical. Each row's
// collapsed summary line (item/meta/amount) stays local to its own file,
// since ExpenseEditRow's needs a standalone-vs-compact variant that
// IncomeEntryEditRow (always compact) doesn't.

export const RowMain = styled.View`
  flex-shrink: 1;
  flex-grow: 1;
`;

// Each entry is its own individually-shadowed floating card, not one shared
// box around the whole list — this is what makes each transaction read as
// boxed on a screen whose own background is a distinct (non-white) tint.
// SummaryRow/EditForm (defined per-file) already provide their own vertical
// padding, so this trims Card's default to horizontal-only.
export const RowCard = styled(Card)`
  padding-top: 0px;
  padding-bottom: 0px;
  padding-left: 12px;
  padding-right: 12px;
  margin-bottom: 10px;
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
  border-radius: 14px;
  padding-vertical: 14px;
  align-items: center;
  background-color: ${(props) => props.theme.primary};
`;

export const SaveButtonText = styled.Text`
  font-size: 16px;
  line-height: 24px;
  color: ${(props) => props.theme.onPrimary};
  font-family: ${(props) => props.theme.fontBold};
`;

// Outlined ghost button: no fill, danger-colored border and label only.
export const DeleteButton = styled(Pressable)`
  flex: 1;
  border-radius: 14px;
  border-width: 1px;
  border-color: ${(props) => props.theme.danger};
  padding-vertical: 14px;
  align-items: center;
`;

export const DeleteButtonText = styled.Text`
  font-size: 16px;
  line-height: 24px;
  color: ${(props) => props.theme.danger};
  font-family: ${(props) => props.theme.fontBold};
`;
