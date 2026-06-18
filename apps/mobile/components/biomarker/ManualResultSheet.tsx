/**
 * ManualResultSheet — bottom-sheet form for manually entering a biomarker
 * result. Validates the value against the biomarker's plausible window before
 * submitting to the API.
 */
import type { Biomarker } from '@vital/shared';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { BottomSheet, Button, toast } from '@/components/ui';
import { colors } from '@/constants/theme';
import { todayIso } from '@/lib/format';
import { ApiError, resultApi } from '@/lib/api';

interface Props {
  visible: boolean;
  onClose: () => void;
  biomarker: Biomarker;
  onSaved: () => void;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 font-mono uppercase tracking-wider" style={{ color: colors.textDim, fontSize: 11 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const inputStyle = {
  backgroundColor: colors.surface,
  borderColor: colors.border,
  borderWidth: 1,
  borderRadius: 4,
  color: colors.white,
  fontSize: 15,
  paddingHorizontal: 16,
  paddingVertical: 12,
} as const;

export function ManualResultSheet({ visible, onClose, biomarker, onSaved }: Props) {
  const [value, setValue] = useState('');
  const [testedAt, setTestedAt] = useState(todayIso());
  const [labName, setLabName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setValue('');
    setTestedAt(todayIso());
    setLabName('');
    setNotes('');
  };

  const onSubmit = async () => {
    const numeric = Number(value);
    if (!value || Number.isNaN(numeric)) {
      toast.error('Enter a numeric value');
      return;
    }
    if (numeric < biomarker.min_plausible || numeric > biomarker.max_plausible) {
      toast.error(
        `Value must be between ${biomarker.min_plausible} and ${biomarker.max_plausible} ${biomarker.unit}`,
      );
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(testedAt)) {
      toast.error('Use YYYY-MM-DD for the test date');
      return;
    }

    setSaving(true);
    try {
      await resultApi.create({
        biomarker_id: biomarker.id,
        value: numeric,
        tested_at: testedAt,
        lab_name: labName || undefined,
        notes: notes || undefined,
      });
      toast.success('Result added');
      reset();
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save result');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add result">
      <Field label={`Value (${biomarker.unit})`}>
        <TextInput
          value={value}
          onChangeText={setValue}
          keyboardType="numeric"
          placeholder={`e.g. ${biomarker.optimal_low}`}
          placeholderTextColor={colors.textMuted}
          style={inputStyle}
        />
      </Field>

      <Field label="Test date">
        <TextInput
          value={testedAt}
          onChangeText={setTestedAt}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textMuted}
          style={inputStyle}
        />
      </Field>

      <Field label="Lab name (optional)">
        <TextInput
          value={labName}
          onChangeText={setLabName}
          placeholder="e.g. Al Borg"
          placeholderTextColor={colors.textMuted}
          style={inputStyle}
        />
      </Field>

      <Field label="Notes (optional)">
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything worth remembering"
          placeholderTextColor={colors.textMuted}
          multiline
          style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]}
        />
      </Field>

      <View className="mt-2 mb-4">
        <Button label="Save Result" onPress={onSubmit} loading={saving} />
      </View>
    </BottomSheet>
  );
}
