import './doorway.css';
export const metadata = {title:'Doorway — Reading & Research',description:'Your private reading and research workspace.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><head><link rel="preload" as="image" href="/room-assets/closing-hand.webp"/></head><body>{children}</body></html>}
