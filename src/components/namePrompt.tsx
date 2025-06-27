import React from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {useUser} from '~/userContext';
import {colors, textStyles} from '~/theme';
import BasePressable from '~/components/basePressable';
import Dialog from '~/components/dialog';
import {create} from 'zustand';

interface NamePromptStore {
  isOpen: boolean;
  mode: 'first' | 'edit';
  input: string;
  open: (mode: 'first' | 'edit', input?: string) => void;
  close: () => void;
  setInput: (input: string) => void;
}

const useNamePromptStore = create<NamePromptStore>(set => ({
  isOpen: false,
  mode: 'first',
  input: '',
  open: (mode, input) => set({isOpen: true, mode, input: input ?? ''}),
  close: () => set({isOpen: false}),
  setInput: input => set({input}),
}));

export function openNamePromptEdit(currentName: string) {
  useNamePromptStore.getState().open('edit', currentName);
}

const NamePrompt: React.FC = () => {
  const {name, setName, loading} = useUser();
  const {isOpen, mode, input, close, setInput, open} = useNamePromptStore();

  // Show dialog on first app entry
  React.useEffect(() => {
    if (!loading && !name && !isOpen) {
      open('first', '');
    }
  }, [loading, name, isOpen, open]);

  if (loading) {
    return (
      <Dialog isModalOpen onBackgroundPress={() => {}}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Dialog>
    );
  }

  if (!isOpen) return null;

  return (
    <Dialog
      isModalOpen={isOpen}
      onBackgroundPress={() => {
        // Prevent closing if it's the first prompt (require name)
        if (mode === 'edit') close();
      }}>
      <View style={styles.container}>
        <Text style={textStyles.subtitle}>הכנס שם</Text>
        <TextInput
          value={input}
          onChangeText={setInput}
          style={styles.yourName}
          placeholder="השם שלך"
          placeholderTextColor={colors.textSecondary}
          autoFocus
          onSubmitEditing={() => {
            if (input.trim().length > 1) {
              setName(input.trim());
              close();
            }
          }}
        />
        <BasePressable
          onPress={() => {
            if (input.trim().length > 1) {
              setName(input.trim());
              close();
            }
          }}>
          <View style={styles.saveButton}>
            <Text style={[textStyles.body, styles.saveText]}>שמור</Text>
          </View>
        </BasePressable>
      </View>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    width: '100%',
  },
  saveText: {color: '#fff'},
  yourName: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    width: '100%',
    marginVertical: 12,
    color: colors.text,
    textAlign: 'center',
  },
  container: {
    width: 250,
    maxWidth: '90%',
    alignItems: 'center',
  },
});

export default NamePrompt;
