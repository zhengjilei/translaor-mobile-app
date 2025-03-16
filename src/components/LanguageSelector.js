import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { updateLanguagePreferences } from '../services/settingsService';

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
  
  // Wrapper for source language change to also update global preferences
  const handleSourceLanguageChange = (value) => {
    onSourceLanguageChange(value);
    
    // Find the language name from the languages array
    const selectedLang = languages.find(lang => lang.value === value);
    const sourceLangName = selectedLang ? selectedLang.label : 'Unknown';
    
    // Update global preferences
    updateLanguagePreferences({
      sourceLanguage: value,
      sourceLanguageName: sourceLangName
    });
  };
  
  // Wrapper for target language change to also update global preferences
  const handleTargetLanguageChange = (value) => {
    onTargetLanguageChange(value);
    
    // Find the language name from the languages array
    const selectedLang = languages.find(lang => lang.value === value);
    const targetLangName = selectedLang ? selectedLang.label : 'Unknown';
    
    // Update global preferences
    updateLanguagePreferences({
      targetLanguage: value,
      targetLanguageName: targetLangName
    });
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.languagePickerContainer}>
        <Text style={styles.label}>From:</Text>
        <DropDownPicker
          open={sourceOpen}
          value={sourceLanguage}
          items={languages}
          setOpen={setSourceOpen}
          setValue={handleSourceLanguageChange}
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
          setValue={handleTargetLanguageChange}
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