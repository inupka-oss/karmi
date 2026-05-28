'use client'
import dynamic from 'next/dynamic'

const DashboardClient = dynamic(() => import('./DashboardClient').then(mod => mod.default), {
  ssr: false,
  loading: () => <p className="text-white">Загрузка админки...</p>
})

interface Props {
  animeList: any[]
  genresList: any[]
}

export default function DashboardClientWrapper({ animeList, genresList }: Props) {
  return <DashboardClient animeList={animeList} genresList={genresList} />
}