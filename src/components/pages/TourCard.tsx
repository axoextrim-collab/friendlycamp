import React from 'react';
import {ArrowLeft,Clock3,MapPin} from 'lucide-react';
import type {Tour} from '../../types';
import type {PublicDeparture} from '../../types/booking';
import {SiteLink} from '../../routing/navigation';
import {tourPath} from '../../routing/routes';
import {bookingDate} from '../../utils/bookingForm';
import {TourActions} from '../TourActions';
export function TourCard({tour,departure}:{key?:React.Key;tour:Tour;departure?:PublicDeparture}){const href=tourPath(tour.id)+(departure?'?'+new URLSearchParams({departureId:departure.id}):'');return <article className="sp-tour-card"><SiteLink href={href} className="sp-tour-image"><img src={tour.image} alt={tour.title} data-motion="off" loading="lazy" decoding="async"/><span>{tour.country}</span></SiteLink><div><span className="sp-eyebrow">برنامه سفر</span><h2><SiteLink href={href}>{tour.title}</SiteLink></h2><p><MapPin size={14}/>{tour.location}</p><span className="sp-tour-duration"><Clock3 size={14}/>{tour.duration}</span>{departure&&<p className="td-departure">{bookingDate(departure.startsAt)} · {departure.remaining.toLocaleString('fa-IR')} جای خالی</p>}<div className="sp-tour-card-bottom"><span><small>{departure?'هزینه پایه نوبت؛ هر نفر':'هزینه پایه درج‌شده'}</small><strong>{departure?departure.price.toLocaleString('fa-IR')+' تومان':tour.price}</strong></span><SiteLink href={href} aria-label={`جزئیات ${tour.title}`}><ArrowLeft size={18}/></SiteLink></div><TourActions tour={tour}/></div></article>;}
