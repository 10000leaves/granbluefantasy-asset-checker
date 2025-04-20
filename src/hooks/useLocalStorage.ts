'use client';

import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { 
  selectedCharactersAtom, 
  selectedWeaponsAtom, 
  selectedSummonsAtom,
  inputValuesAtom,
  weaponCountsAtom,
  weaponAwakeningsAtom,
  loadFromLocalStorage,
  saveToLocalStorage,
  WeaponAwakenings
} from '@/atoms';

// ローカルストレージのキー
const SELECTED_CHARACTERS_KEY = 'selectedCharacters';
const SELECTED_WEAPONS_KEY = 'selectedWeapons';
const SELECTED_SUMMONS_KEY = 'selectedSummons';
const INPUT_VALUES_KEY = 'inputValues';
const WEAPON_COUNTS_KEY = 'weaponCounts';
const WEAPON_AWAKENINGS_KEY = 'weaponAwakenings';

export function useLocalStorage() {
  const [selectedCharacters, setSelectedCharacters] = useAtom(selectedCharactersAtom);
  const [selectedWeapons, setSelectedWeapons] = useAtom(selectedWeaponsAtom);
  const [selectedSummons, setSelectedSummons] = useAtom(selectedSummonsAtom);
  const [inputValues, setInputValues] = useAtom(inputValuesAtom);
  const [weaponCounts, setWeaponCounts] = useAtom(weaponCountsAtom);
  const [weaponAwakenings, setWeaponAwakenings] = useAtom(weaponAwakeningsAtom);

  // ページ読み込み時にローカルストレージから値を読み込む
  useEffect(() => {
    const loadedCharacters = loadFromLocalStorage<string[]>(SELECTED_CHARACTERS_KEY, []);
    const loadedWeapons = loadFromLocalStorage<string[]>(SELECTED_WEAPONS_KEY, []);
    const loadedSummons = loadFromLocalStorage<string[]>(SELECTED_SUMMONS_KEY, []);
    const loadedInputValues = loadFromLocalStorage<Record<string, any>>(INPUT_VALUES_KEY, {});
    const loadedWeaponCounts = loadFromLocalStorage<Record<string, number>>(WEAPON_COUNTS_KEY, {});
    const loadedWeaponAwakenings = loadFromLocalStorage<Record<string, WeaponAwakenings>>(WEAPON_AWAKENINGS_KEY, {});

    setSelectedCharacters(loadedCharacters);
    setSelectedWeapons(loadedWeapons);
    setSelectedSummons(loadedSummons);
    setInputValues(loadedInputValues);
    setWeaponCounts(loadedWeaponCounts);
    setWeaponAwakenings(loadedWeaponAwakenings);
  }, [setSelectedCharacters, setSelectedWeapons, setSelectedSummons, setInputValues, setWeaponCounts, setWeaponAwakenings]);

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

  useEffect(() => {
    saveToLocalStorage(WEAPON_COUNTS_KEY, weaponCounts);
  }, [weaponCounts]);

  useEffect(() => {
    saveToLocalStorage(WEAPON_AWAKENINGS_KEY, weaponAwakenings);
  }, [weaponAwakenings]);

  return {
    selectedCharacters,
    selectedWeapons,
    selectedSummons,
    inputValues,
    weaponCounts,
    weaponAwakenings,
  };
}
