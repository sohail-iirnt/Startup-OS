import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, Check, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { registerWithEmail } from '../services/authService'
import { acceptWorkspaceInvitation } from '../services/invitationService'
import { useAuth } from '../context/useAuth'

function Register() {
