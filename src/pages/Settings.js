import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // Hubi in jidkani sax yahay

export default function Settings() {
  const [settings, setSettings] = useState({ school_name: '', logo_url: '' });

  // 1. Marka boggu furmo, xogta ka soo jiid Supabase
  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('school_settings')
        .select('*')
        .single();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  // 2. Marka la badalo xogta, u dir Supabase
  const handleSave = async () => {
    const { error } = await supabase
      .from('school_settings')
      .update({ school_name: settings.school_name, logo_url: settings.logo_url })
      .eq('id', 1);

    if (error) alert("Qalad ayaa dhacay: " + error.message);
    else alert("Xogta si guul leh ayaa loo badalay!");
  };

  return (
    <div>
      <h2>Settings-ka Dugsiga</h2>
      <input 
        value={settings.school_name}
        onChange={(e) => setSettings({...settings, school_name: e.target.value})}
        placeholder="Magaca Dugsiga"
      />
      <button onClick={handleSave}>Keydi (Save)</button>
    </div>
  );
}
