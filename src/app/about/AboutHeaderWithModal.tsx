'use client';

import React, { useState } from 'react';
import AuthHeader from '@/components/AuthHeader';
import EntryModal from '@/components/EntryModal';

export default function AboutHeaderWithModal() {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'signup' | 'login'>('login');

  return (
    <>
      <AuthHeader
        onShowModal={(m) => {
          setModalMode(m);
          setShowModal(true);
        }}
      />
      {showModal && <EntryModal mode={modalMode} onClose={() => setShowModal(false)} />}
    </>
  );
}


