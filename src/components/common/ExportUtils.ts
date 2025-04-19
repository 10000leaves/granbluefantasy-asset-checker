import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Papa from 'papaparse';
import { InputItem, InputGroup } from '@/atoms';

// ExportItemsの型定義（必要なものだけ残す）
export interface ExportItems {
  characters: any[];
  weapons: any[];
  summons: any[];
}

// SessionDataの型定義（必要なものだけ残す）
export interface SessionData {
  inputValues: Record<string, any>;
}

// jsPDFにautoTableを追加するための型拡張
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => any;
    lastAutoTable: {
      finalY: number;
    };
  }
}

// PDF出力処理
export const generatePDF = async (
  element: HTMLElement,
  inputGroups: InputGroup[],
  sessionData: SessionData,
  pageItems: ExportItems
) => {
  // HTMLをクローンして、スタイルを適用
  const clonedElement = element.cloneNode(true) as HTMLElement;
  document.body.appendChild(clonedElement);
  
  // スタイルを調整
  clonedElement.style.width = '800px';
  clonedElement.style.padding = '20px';
  clonedElement.style.backgroundColor = 'white';
  clonedElement.style.position = 'absolute';
  clonedElement.style.left = '-9999px';
  
  try {
    // HTML2Canvasを使用して、HTMLを画像に変換
    const canvas = await html2canvas(clonedElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    
    // PDFを生成
    const pdfWidth = 210; // A4サイズ（mm）
    const pdfHeight = 297;
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10;
    
    // PDFを生成
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      compress: true
    });
    
    // 画像をPDFに追加
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    // フッター
    const pageCount = doc.internal.pages ? doc.internal.pages.length - 1 : 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Generated by granblue-asset-checker • ${new Date().toLocaleDateString()}`,
        105,
        287,
        { align: 'center' }
      );
    }
    
    // PDFを保存
    doc.save(`granblue-asset-checker-${new Date().toISOString().slice(0, 10)}.pdf`);
  } finally {
    // クローンした要素を削除
    if (clonedElement.parentNode) {
      clonedElement.parentNode.removeChild(clonedElement);
    }
  }
};

// CSV出力処理
export const generateCSV = (
  pageItems: ExportItems,
  inputGroups: InputGroup[],
  sessionData: SessionData
) => {
  let csvData: any[] = [];
  
  // ヘッダー行とメタデータ
  csvData.push(['#GRANBLUE_CHECKER_DATA_FORMAT_V1']);
  csvData.push(['#EXPORT_DATE', new Date().toISOString()]);
  csvData.push([]);
  
  // セクション区切り - アイテム
  csvData.push(['#SECTION', 'ITEMS']);
  csvData.push(['タイプ', 'ID', '名前', '所持数']);
  
  // キャラ
  if (pageItems.characters.length > 0) {
    pageItems.characters.forEach(char => {
      csvData.push(['character', char.id, char.name, '']);
    });
  }
  
  // 武器
  if (pageItems.weapons.length > 0) {
    pageItems.weapons.forEach(weapon => {
      const count = weapon.count || 0;
      csvData.push(['weapon', weapon.id, weapon.name, count.toString()]);
    });
  }
  
  // 召喚石
  if (pageItems.summons.length > 0) {
    pageItems.summons.forEach(summon => {
      csvData.push(['summon', summon.id, summon.name, '']);
    });
  }
  
  // データがない場合
  if (pageItems.characters.length === 0 && pageItems.weapons.length === 0 && pageItems.summons.length === 0) {
    csvData.push(['', '', '選択されたアイテムがありません']);
  }
  
  csvData.push([]);
  
  // セクション区切り - ユーザー情報
  csvData.push(['#SECTION', 'USER_INFO']);
  csvData.push(['グループID', 'グループ名', '項目ID', '項目名', '項目タイプ', '値']);
  
  // 入力グループごとに情報を追加
  if (inputGroups && inputGroups.length > 0) {
    inputGroups.forEach(group => {
      if (group.items && group.items.length > 0) {
        group.items.forEach(item => {
          const value = sessionData?.inputValues ? sessionData.inputValues[item.id] : null;
          const displayValue = sessionData?.inputValues ? renderInputValue(item, value) : '-';
          
          // 生の値を保存（インポート時に正確に復元するため）
          csvData.push([
            group.group_id || '', 
            group.group_name || '', 
            item.id || '', 
            item.name || '', 
            item.type || '', 
            value !== undefined && value !== null ? String(value) : ''
          ]);
        });
      }
    });
  }
  
  // CSVに変換
  const csv = Papa.unparse(csvData);
  
  // BOMを追加して文字化けを防止
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `granblue-asset-checker-${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// CSVインポート処理
export const importCSV = (
  csvData: string,
  setSelectedCharacters: (ids: string[]) => void,
  setSelectedWeapons: (ids: string[]) => void,
  setSelectedSummons: (ids: string[]) => void,
  setInputValues: (values: Record<string, any>) => void,
  currentSelectedCharacters: string[],
  currentSelectedWeapons: string[],
  currentSelectedSummons: string[],
  currentInputValues: Record<string, any>
): { success: boolean; message: string } => {
  try {
    const results = Papa.parse(csvData, { header: false });
    
    if (!results.data || !Array.isArray(results.data)) {
      return { success: false, message: 'CSVの解析に失敗しました' };
    }
    
    const importedIds: string[] = [];
    const importedUserInfo: Record<string, any> = {};
    
    // CSVフォーマットのバージョンチェック
    let isValidFormat = false;
    let currentSection = '';
    
    results.data.forEach((row: any, index: number) => {
      if (Array.isArray(row)) {
        // フォーマットバージョンチェック
        if (index === 0 && row[0] === '#GRANBLUE_CHECKER_DATA_FORMAT_V1') {
          isValidFormat = true;
          return;
        }
        
        // セクション識別
        if (row[0] === '#SECTION' && row.length > 1) {
          currentSection = row[1];
          return;
        }
        
        // アイテムセクションの処理
        if (currentSection === 'ITEMS' && row.length >= 3) {
          const [type, id, name] = row;
          if (id && typeof id === 'string' && !id.startsWith('#') && !id.startsWith('タイプ')) {
            importedIds.push(id);
          }
        }
        
        // ユーザー情報セクションの処理
        if (currentSection === 'USER_INFO' && row.length >= 6) {
          const [groupId, groupName, itemId, itemName, itemType, value] = row;
          if (itemId && typeof itemId === 'string' && !itemId.startsWith('#') && !itemId.startsWith('グループID')) {
            // 値の型変換
            let typedValue: any = value;
            if (itemType === 'checkbox') {
              typedValue = value === 'true';
            } else if (itemType === 'number') {
              typedValue = value ? Number(value) : null;
            }
            
            importedUserInfo[itemId] = typedValue;
          }
        }
      }
    });
    
    // 古いフォーマットの場合のフォールバック処理
    if (!isValidFormat) {
      results.data.forEach((row: any) => {
        if (Array.isArray(row) && row.length >= 3) {
          const [type, id, name] = row;
          if (id && typeof id === 'string' && !id.startsWith('#')) {
            importedIds.push(id);
          }
        }
      });
    }
    
    // アトムを更新
    if (importedIds.length > 0 || Object.keys(importedUserInfo).length > 0) {
      // キャラ、武器、召喚石のIDを分類
      const characterIds: string[] = [];
      const weaponIds: string[] = [];
      const summonIds: string[] = [];
      
      importedIds.forEach(id => {
        // IDの先頭文字でタイプを判断
        if (id.startsWith('character_')) {
          characterIds.push(id);
        } else if (id.startsWith('weapon_')) {
          weaponIds.push(id);
        } else if (id.startsWith('summon_')) {
          summonIds.push(id);
        } else {
          // タイプが不明な場合はキャラとして扱う
          characterIds.push(id);
        }
      });
      
      // 選択状態を更新
      if (characterIds.length > 0) {
        setSelectedCharacters([...new Set([...currentSelectedCharacters, ...characterIds])]);
      }
      
      if (weaponIds.length > 0) {
        setSelectedWeapons([...new Set([...currentSelectedWeapons, ...weaponIds])]);
      }
      
      if (summonIds.length > 0) {
        setSelectedSummons([...new Set([...currentSelectedSummons, ...summonIds])]);
      }
      
      // ユーザー情報を更新
      if (Object.keys(importedUserInfo).length > 0) {
        setInputValues({
          ...currentInputValues,
          ...importedUserInfo
        });
      }
      
      let message = '';
      if (importedIds.length > 0 && Object.keys(importedUserInfo).length > 0) {
        message = `${importedIds.length}個のアイテムと${Object.keys(importedUserInfo).length}個のユーザー情報をインポートしました`;
      } else if (importedIds.length > 0) {
        message = `${importedIds.length}個のアイテムをインポートしました`;
      } else {
        message = `${Object.keys(importedUserInfo).length}個のユーザー情報をインポートしました`;
      }
      
      return { success: true, message };
    } else {
      return { success: false, message: 'インポートするデータが見つかりませんでした' };
    }
  } catch (error) {
    console.error('Error importing CSV:', error);
    return { success: false, message: 'CSVのインポートに失敗しました' };
  }
};

// 入力項目の値を表示
export const renderInputValue = (item: InputItem, value: any): string => {
  if (item.type === 'checkbox') {
    return value ? '✅' : '❌';
  } else if (item.type === 'number' && item.name === 'キャラ与ダメ') {
    // valueがundefinedまたはnullの場合は0%を返す
    return `${value !== undefined && value !== null ? value : 0}%`;
  } else {
    return value !== undefined && value !== null ? String(value) : '-';
  }
};
