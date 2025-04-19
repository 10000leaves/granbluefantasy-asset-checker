'use client';

import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { 
  selectedCharactersAtom, 
  selectedWeaponsAtom, 
  selectedSummonsAtom,
  inputValuesAtom,
  loadFromLocalStorage,
  saveToLocalStorage
} from '@/atoms';

// ローカルストレージのキー
const SELECTED_CHARACTERS_KEY = 'selectedCharacters';
const SELECTED_WEAPONS_KEY = 'selectedWeapons';
const SELECTED_SUMMONS_KEY = 'selectedSummons';
const INPUT_VALUES_KEY = 'inputValues';

export function useLocalStorage() {
  const [selectedCharacters, setSelectedCharacters] = useAtom(selectedCharactersAtom);
  const [selectedWeapons, setSelectedWeapons] = useAtom(selectedWeaponsAtom);
  const [selectedSummons, setSelectedSummons] = useAtom(selectedSummonsAtom);
  const [inputValues, setInputValues] = useAtom(inputValuesAtom);

  // ページ読み込み時にローカルストレージから値を読み込む
  useEffect(() => {
    const loadedCharacters = loadFromLocalStorage<string[]>(SELECTED_CHARACTERS_KEY, []);
    const loadedWeapons = loadFromLocalStorage<string[]>(SELECTED_WEAPONS_KEY, []);
    const loadedSummons = loadFromLocalStorage<string[]>(SELECTED_SUMMONS_KEY, []);
    const loadedInputValues = loadFromLocalStorage<Record<string, any>>(INPUT_VALUES_KEY, {});

    setSelectedCharacters(loadedCharacters);
    setSelectedWeapons(loadedWeapons);
    setSelectedSummons(loadedSummons);
    setInputValues(loadedInputValues);
  }, [setSelectedCharacters, setSelectedWeapons, setSelectedSummons, setInputValues]);

  // 値が変更されたらローカルストレージに保存
  useEffect(() => {
    saveToLocalStorage(SELECTED_CHARACTERS_KEY, selectedCharacters);
  }, [selectedCharacters]);

  useEffect(() => {
    saveToLocalStorage(SELECTED_WEAPONS_KEY, selectedWeapons);
  }, [selectedWeapons]);

  useEffect(() => {
    saveToLocalStorage(SELECTED_SUMMONS_KEY, selectedSummons);
  }, [selectedSummons]);

  useEffect(() => {
    saveToLocalStorage(INPUT_VALUES_KEY, inputValues);
  }, [inputValues]);

  return {
    selectedCharacters,
    selectedWeapons,
    selectedSummons,
    inputValues,
  };
}
