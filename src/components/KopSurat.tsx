import React from 'react';
import { TeacherInfo } from '../types/pkg';
import { KemenagLogo } from './KemenagLogo';

interface KopSuratProps {
  teacher: TeacherInfo;
  className?: string;
  logoSize?: number;
}

export const KopSurat: React.FC<KopSuratProps> = ({
  teacher,
  className = '',
  logoSize = 85
}) => {
  const hasCustomLogo = teacher.schoolLogoUrl && teacher.schoolLogoUrl.startsWith('data:image');
  const isKemenagLogo = !teacher.schoolLogoUrl || teacher.schoolLogoUrl === 'kemenag';

  return (
    <div className={`kop-surat-container font-sans text-black ${className}`}>
      <div className="flex items-center gap-4 sm:gap-6 pb-2">
        {/* Left: Logo */}
        <div className="shrink-0 flex items-center justify-center">
          {hasCustomLogo ? (
            <img
              src={teacher.schoolLogoUrl}
              alt="Logo Madrasah / RA"
              style={{ width: `${logoSize}px`, height: `${logoSize}px` }}
              className="object-contain"
            />
          ) : isKemenagLogo ? (
            <KemenagLogo size={logoSize} />
          ) : (
            <div
              style={{ width: `${logoSize}px`, height: `${logoSize}px` }}
              className="border border-dashed border-slate-400 rounded flex items-center justify-center text-xs text-slate-400"
            >
              Logo
            </div>
          )}
        </div>

        {/* Center / Right: School Information */}
        <div className="flex-1 text-center">
          {teacher.foundationName && (
            <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-800 leading-tight">
              {teacher.foundationName}
            </h3>
          )}
          <h1 className="text-base sm:text-lg font-extrabold tracking-wide uppercase text-black leading-tight mt-0.5">
            {teacher.schoolName}
          </h1>

          <div className="text-[11px] sm:text-xs font-semibold text-slate-800 mt-1 flex items-center justify-center gap-4 flex-wrap">
            {teacher.nsm && <span>NSM : {teacher.nsm}</span>}
            {teacher.npsn && <span>NPSN : {teacher.npsn}</span>}
          </div>

          <p className="text-[10px] sm:text-[11px] text-slate-700 leading-snug mt-1">
            {teacher.schoolAddress}
            {teacher.schoolVillage && `, Ds. ${teacher.schoolVillage}`}
            {teacher.schoolDistrict && `, Kec. ${teacher.schoolDistrict}`}
            {teacher.schoolCity && `, ${teacher.schoolCity}`}
            {teacher.schoolPostalCode && ` ${teacher.schoolPostalCode}`}
          </p>

          <p className="text-[9px] sm:text-[10px] text-slate-600 mt-0.5 flex items-center justify-center gap-3 flex-wrap">
            {teacher.schoolPhone && <span>Telp : {teacher.schoolPhone}</span>}
            {teacher.schoolEmail && <span>Email : {teacher.schoolEmail}</span>}
            {teacher.schoolWebsite && <span>Website : {teacher.schoolWebsite}</span>}
          </p>
        </div>
      </div>

      {/* Official Indonesian Government Double Line Kop Separator */}
      <div className="w-full mt-1 mb-4">
        <div className="h-[3px] bg-black w-full"></div>
        <div className="h-[1px] bg-black w-full mt-[2px]"></div>
      </div>
    </div>
  );
};
