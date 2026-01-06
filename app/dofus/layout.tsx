'use client';
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
        
        <section className="relative">
          <div className="w-full h-auto absolute top-0 left-0 -z-10 pointer-none:">
                <Swiper
                    slidesPerView={1}
                    spaceBetween={0}
                    loop={true}
                    autoplay={{ delay: 6000, disableOnInteraction: false }}
                    modules={[Autoplay]}
                >
                    <SwiperSlide>
                        <img src="/images/dofus/bg/bg.webp" alt="" className='w-full h-full' />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="/images/dofus/bg/bg2.png" alt="" className='w-full h-full' />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="/images/dofus/bg/bg1.webp" alt="" className='w-full h-full' />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="/images/dofus/bg/bg3.webp" alt="" className='w-full h-full' />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="/images/dofus/bg/bg4.jpg" alt="" className='w-full h-full' />
                    </SwiperSlide>
                </Swiper>
            </div>
            {children}
        </section>
    )
  }