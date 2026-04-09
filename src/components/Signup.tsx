import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { UserPlus, Mail, Lock, Chrome, Phone, User as UserIcon } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthProvider';

export default function Signup() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-8 h-8 border-4 border-[#39FF14]/30 border-t-[#39FF14] rounded-full animate-spin"></div>
    </div>
  );
}
