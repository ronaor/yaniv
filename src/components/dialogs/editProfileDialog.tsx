import React from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import {useUser} from '~/store/userStore';
import Dialog from '~/components/dialog';
import {create} from 'zustand';
import {OutlinedText} from '../cartoonText';
import LinearGradient from 'react-native-linear-gradient';
import SimpleButton from '../menu/simpleButton';
import XButton from '../menu/xButton';
import AvatarPicker from '../user/avatarPicker';
import AvatarImage from '../user/avatarImage';
import Animated, {
  FadeInUp,
  FadeOutUp,
  LinearTransition,
} from 'react-native-reanimated';
import {User} from '~/types/player';

const {width: screenWidth} = Dimensions.get('screen');

interface EditProfileDialogStore {
  isOpen: boolean;
  mode: 'first' | 'edit';
  input: string;
  selectedAvatarIndex: number;
  open: (mode: 'first' | 'edit', input?: string, avatarIndex?: number) => void;
  close: () => void;
  setInput: (input: string) => void;
  setSelectedAvatarIndex: (index: number) => void;
}

const useEditProfileDialogStore = create<EditProfileDialogStore>(set => ({
  isOpen: false,
  mode: 'first',
  input: '',
  selectedAvatarIndex: 0,
  open: (mode, input, avatarIndex) =>
    set({
      isOpen: true,
      mode,
      input: input ?? '',
      selectedAvatarIndex: avatarIndex ?? 0,
    }),
  close: () => set({isOpen: false}),
  setInput: input => set({input}),
  setSelectedAvatarIndex: index => set({selectedAvatarIndex: index}),
}));

export function openEditProfileDialogEdit(user: User) {
  useEditProfileDialogStore
    .getState()
    .open('edit', user.nickName, user.avatarIndex);
}

const EditProfileDialog: React.FC = () => {
  const {user, saveProfile, loading} = useUser();
  const {
    isOpen,
    mode,
    input,
    selectedAvatarIndex,
    close,
    setInput,
    setSelectedAvatarIndex,
    open,
  } = useEditProfileDialogStore();

  const [showAvatarPicker, setShowAvatarPicker] = React.useState(false);

  const handleSave = () => {
    if (input.trim().length > 1) {
      saveProfile({nickName: input.trim(), avatarIndex: selectedAvatarIndex});
      close();
    }
  };

  const handleClose = () => {
    // Prevent closing if it's the first prompt (require name)
    if (mode === 'edit') {
      close();
    }
  };

  // Show dialog on first app entry
  React.useEffect(() => {
    if (!loading && !user.nickName && !isOpen) {
      open('first', '', 0);
    }
  }, [loading, user.nickName, isOpen, open]);

  if (loading) {
    return (
      <Dialog isModalOpen onBackgroundPress={() => {}}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={'white'} />
          <OutlinedText
            text="Loading.."
            fontSize={30}
            width={300}
            height={32}
            fillColor={'#ffffffff'}
            strokeColor={'#231c18aa'}
            strokeWidth={7}
            fontFamily="LuckiestGuy-Regular"
          />
        </View>
      </Dialog>
    );
  }

  return (
    <Dialog isModalOpen={isOpen} onBackgroundPress={handleClose}>
      <View style={styles.body}>
        {mode === 'edit' && (
          <View style={styles.xButton}>
            <XButton onPress={handleClose} />
          </View>
        )}
        <LinearGradient
          style={styles.gradient}
          colors={['#DE8216', '#A9500F', '#A9500F', '#A9500F', '#783505ff']}>
          <View style={styles.content}>
            <Text style={styles.headerTitle}>
              {mode === 'edit' ? 'EDIT PROFILE' : 'SET PROFILE'}
            </Text>

            {/* Current Avatar Display */}
            <View style={styles.currentAvatarContainer}>
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={() => setShowAvatarPicker(!showAvatarPicker)}>
                <AvatarImage index={selectedAvatarIndex} size={80} />
              </TouchableOpacity>
            </View>

            {/* Name Input */}
            <View style={styles.inputWrapper}>
              <LinearGradient
                style={styles.inputGradient}
                colors={['#EBD5BF', '#FFF5D5']}>
                <TextInput
                  style={styles.input}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Player name"
                  autoCapitalize="characters"
                  placeholderTextColor={'#A0977D'}
                />
              </LinearGradient>
            </View>

            <View style={styles.buttonAdjuster}>
              <SimpleButton
                disabled={input.length === 0}
                text="SAVE"
                onPress={handleSave}
                colors={['#65D000', '#2D9900', '#217701']}
              />
            </View>
          </View>
        </LinearGradient>
      </View>
      {/* Avatar Picker */}
      {showAvatarPicker && (
        <Pressable
          disabled={!showAvatarPicker}
          style={[StyleSheet.absoluteFill, styles.overlay]}
          onPress={() => setShowAvatarPicker(false)}>
          <Animated.View
            entering={FadeInUp}
            exiting={FadeOutUp}
            layout={LinearTransition}
            style={styles.avatarPickerContainer}>
            <AvatarPicker
              selectedIndex={selectedAvatarIndex}
              onSelectAvatar={index => {
                setSelectedAvatarIndex(index);
                setShowAvatarPicker(false); // Auto-close after selection
              }}
            />
          </Animated.View>
        </Pressable>
      )}
    </Dialog>
  );
};

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  body: {
    backgroundColor: '#502404',
    borderRadius: 28,
    shadowColor: '#000',
    padding: 3,
  },
  gradient: {
    backgroundColor: '#843402',
    borderRadius: 25,
    paddingHorizontal: 3,
    flexDirection: 'column',
    padding: 3,
  },
  content: {
    backgroundColor: '#A9500F',
    borderRadius: 23,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FDE689',
    padding: 10,
    textAlign: 'center',
  },
  currentAvatarContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatarButton: {
    position: 'relative',
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 3,
    backgroundColor: '#FFF5D5',
    borderColor: '#5B2400',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 3,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#00000080',
    paddingVertical: 4,
    alignItems: 'center',
  },
  editText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarPickerContainer: {
    position: 'absolute',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    bottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FDE689',
    textAlign: 'center',
  },
  buttonAdjuster: {
    width: '100%',
    justifyContent: 'center',
    padding: 5,
    paddingHorizontal: 20,
  },
  xButton: {position: 'absolute', zIndex: 10, right: -20, top: -20},
  inputWrapper: {
    width: '100%',
    borderColor: '#5B2400',
    borderWidth: 3,
    borderRadius: 20,
  },
  inputGradient: {
    padding: 3,
    borderRadius: 17,
  },
  input: {
    padding: 10,
    backgroundColor: '#FFF5D5',
    borderRadius: 16,
    fontSize: 20,
    fontWeight: '700',
    minWidth: screenWidth * 0.55,
    color: '#642a00',
    textAlign: 'center',
  },
  overlay: {zIndex: 200},
});

export default EditProfileDialog;
