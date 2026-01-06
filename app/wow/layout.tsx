'use client'
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Autoplay } from 'swiper/modules';


export default function RootLayout({
    children
  }: Readonly<{
    children: React.ReactNode
  }>) {
    return (
        
        <section className="relative w-full h-full">
            <div className="w-full h-auto absolute top-0 left-0 -z-10 pointer-none">
                <Swiper
                    slidesPerView={1}
                    spaceBetween={0}
                    loop={true}
                    autoplay={{ delay: 36000, disableOnInteraction: false }}
                    modules={[Autoplay]}
                >
                    <SwiperSlide>
                        <img src="./images/wow/bg/bg3.jpg" alt="" className='w-full h-full' />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="./images/wow/bg/bg1.webp" alt="" className='w-full h-full' />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="./images/wow/bg/bg2.jpg" alt="" className='w-full h-full' />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="./images/wow/bg/bg4.webp" alt="" className='w-full h-full' />
                    </SwiperSlide>

                </Swiper>
            </div>
            {children}
        </section>
        
    )
  }