import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SalesRecord } from '../types';
import { initialData } from '../data/mockData';

interface ContextType {
  data: SalesRecord[];
  addData: (newData: SalesRecord[]) => void;
}

const DataContext = createContext<ContextType | null>(null);

export function DataProvider({children}: {children: ReactNode}) {
  const [data, setData] = useState<SalesRecord[]>([]);

  const addData = (newData: SalesRecord[]) => {
    const maxId = data.length > 0 ? Math.max(...data.map(d => d.id_ventestocke)) : 0;
    const updated = newData.map((rec, i) => ({...rec, id_ventestocke: maxId + i + 1}));
    setData(prev => [...prev, ...updated]);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const newData: SalesRecord[] = await res.json();
          setData(newData);
        }
      } catch (err) {
        console.log('Backend offline, mock data:', err);
        setData(initialData);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return <DataContext.Provider value={{data, addData}}>{children}</DataContext.Provider>;
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};