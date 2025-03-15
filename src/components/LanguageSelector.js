import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

const LanguageSelector = ({ 
  sourceLanguage,
  targetLanguage,
  onSourceLanguageChange,
  onTargetLanguageChange,
  onSwapLanguages,
  languages
}) => {
  // DropDown states
  const [sourceOpen, setSourceOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  
  return (
    <View style={styles.container}>
      <View style={styles.languagePickerContainer}>
        <Text style={styles.label}>From:</Text>
        <DropDownPicker
          open={sourceOpen}
          value={sourceLanguage}
          items={languages}
          setOpen={setSourceOpen}
          setValue={onSourceLanguageChange}
          style={styles.picker}
          dropDownContainerStyle={styles.dropDownContainer}
          zIndex={3000}
          zIndexInverse={1000}
        />
      </View>
      
      <TouchableOpacity 
        style={styles.swapButton}
        onPress={onSwapLanguages}
      >
        <Text style={styles.swapButtonText}>⇄</Text>
      </TouchableOpacity>
      
      <View style={styles.languagePickerContainer}>
        <Text style={styles.label}>To:</Text>
        <DropDownPicker
          open={targetOpen}
          value={targetLanguage}
          items={languages}
          setOpen={setTargetOpen}
          setValue={onTargetLanguageChange}
          style={styles.picker}
          dropDownContainerStyle={styles.dropDownContainer}
          zIndex={2000}
          zIndexInverse={2000}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 3000,
  },
  languagePickerContainer: {
    width: '40%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  picker: {
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  dropDownContainer: {
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  swapButton: {
    backgroundColor: '#4a6ea9',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  swapButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default LanguageSelector;