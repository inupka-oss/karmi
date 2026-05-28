'use client'
import dynamic from 'next/dynamic'

export const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.div),
  { ssr: false }
)