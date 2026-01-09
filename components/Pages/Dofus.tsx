'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Autoplay } from 'swiper/modules';
import BlurCard from '@/components/Home/BlurCard';
import { Button } from '@/components/ui/button';

export default function Dofus() {

    return (
        <section className="relative w-full h-full">
            <div className="w-full h-auto absolute top-0 left-0 -z-10 pointer-none">
                <Swiper
                    slidesPerView={1}
                    spaceBetween={0}
                    loop={true}
                    autoplay={{ delay: 6000, disableOnInteraction: false }}
                    modules={[Autoplay]}
                >
                    <SwiperSlide>
                        <img src="./images/dofus/bg/bg.webp" alt="" className='w-full h-full' />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="./images/dofus/bg/bg2.png" alt="" className='w-full h-full' />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="./images/dofus/bg/bg1.webp" alt="" className='w-full h-full' />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="./images/dofus/bg/bg3.webp" alt="" className='w-full h-full' />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="./images/dofus/bg/bg4.jpg" alt="" className='w-full h-full' />
                    </SwiperSlide>
                </Swiper>
            </div>
            <div className="relative w-full h-full">
                <div className='absolute top-10 left-10'>
                    <BlurCard>
                        <div className="w-fit flex flex-col items-center">
                            <div className=" w-fit flex justify-center p-10">
                                <img src="./images/dofus/bg/dofus-tag.png" alt="" className='w-full h-full' />
                            </div>
                            <div className=" bg-neutral-800/20 px-6 py-3 w-full">
                                <h3 className="text-md font-semibold text-foreground mb-2 text-right">version 2.x.x</h3>
                                {/* 
                                <Button variant="default" className="w-full font-bold text-white hover:scale-105 transition-all ease cursor-pointer">Télécharger</Button>
                                */}
                            </div>
                        </div>
                    </BlurCard>
                </div>
            </div>
        </section>
    )
}