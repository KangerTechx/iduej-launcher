'use client'

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export default function SetColor() {
  const [color, setColor] = useState('blue'); 
 

  useEffect(() => {
    const savedColor = localStorage.getItem('primary-color');
    if (savedColor) {
      setColor(savedColor);
      document.documentElement.dataset.color = savedColor
    }
  }, []);

  const colorSelected = (color: string) => {
    setColor(color)
    localStorage.setItem('primary-color', color);
    document.documentElement.dataset.color = color
  }

  return (
    <div className='mt-12'>
       
        <p>Couleur :</p>

        <div className='grid grid-cols-3 gap-4 mt-4'>

            <Button className={cn(color == 'blue'? 'border-2 border-black dark:border-white': '','bg-[hsl(221.2,83.2%,53.3%)] hover:bg-[hsl(221.2,83.2%,53.3%)] hover:border-2 dark:hover:border-white hover:border-black')} onClick={() => {colorSelected('blue')}}></Button>
            <Button className={cn(color == 'orange'? 'border-2 border-black dark:border-white': '','bg-[hsl(24.6,95%,53.1%)] hover:bg-[hsl(24.6,95%,53.1%)] hover:border-2 dark:hover:border-white hover:border-black')} onClick={() => {colorSelected('orange')}}></Button>
            <Button className={cn(color == 'red'? 'border-2 border-black dark:border-white': '','bg-[hsl(0,72.2%,50.6%)] hover:bg-[hsl(0,72.2%,50.6%)] hover:border-2 dark:hover:border-white hover:border-black')} onClick={() => {colorSelected('red')}}></Button>
            <Button className={cn(color == 'green'? 'border-2 border-black dark:border-white': '','bg-[hsl(142.1,76.2%,36.3%)] hover:bg-[hsl(142.1,76.2%,36.3%)] hover:border-2 dark:hover:border-white hover:border-black')} onClick={() => {colorSelected('green')}}></Button>
            <Button className={cn(color == 'pink'? 'border-2 border-black dark:border-white': '','bg-[hsl(347,90%,56%)] hover:bg-[hsl(347,90%,56%)] hover:border-2 dark:hover:border-white hover:border-black')} onClick={() => {colorSelected('pink')}}></Button>
            <Button className={cn(color == 'yellow'? 'border-2 border-black dark:border-white': '','bg-[hsl(47.9,95.8%,53.1%)] hover:bg-[hsl(47.9,95.8%,53.1%)] hover:border-2 dark:hover:border-white hover:border-black')} onClick={() => {colorSelected('yellow')}}></Button>
            <Button className={cn(color == 'purple'? 'border-2 border-black dark:border-white': '','bg-[hsl(262.1,83.3%,57.8%)] hover:bg-[hsl(262.1,83.3%,57.8%)] hover:border-2 dark:hover:border-white hover:border-black')} onClick={() => {colorSelected('purple')}}></Button>
            
      
      </div>
    </div>
  );
}
