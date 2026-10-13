import { TeacherRecord } from '../types/pkg';
import { PKG_COMPONENTS } from './pkgStructure';

// Default all 79 indicators with score (0 for blank, 2 for full)
export const createDefaultScores = (defaultVal = 0): Record<string, number> => {
  const scores: Record<string, number> = {};
  PKG_COMPONENTS.forEach((comp) => {
    comp.indicators.forEach((ind) => {
      scores[ind.code] = defaultVal;
    });
  });
  return scores;
};

// Blank clean template requested by user for sharing to other schools
export const BLANK_TEACHER_RECORD: TeacherRecord = {
  id: 'guru-1',
  updatedAt: new Date().toISOString(),
  teacher: {
    id: 'guru-1',
    name: '',
    nip: '',
    nuptk: '',
    birthPlaceDate: '',
    rankGrade: 'Guru Tetap Yayasan',
    position: 'Guru Kelas',
    teacherType: 'Guru Kelas',
    teachingAssignment: 'Guru Kelas RA',
    additionalDuty: '',
    tmtTeacher: '',
    serviceYears: '',
    gender: 'Perempuan',
    lastEducation: 'S1 PG-PAUD',
    foundationName: '',
    schoolName: '',
    nsm: '',
    npsn: '',
    schoolAddress: '',
    schoolVillage: '',
    schoolDistrict: '',
    schoolCity: '',
    schoolProvince: '',
    schoolPostalCode: '',
    schoolPhone: '',
    schoolEmail: '',
    schoolWebsite: '',
    schoolLogoUrl: 'kemenag',
    unitOfWork: '',
    workStartDateAtSchool: '',
    kemenagOfficeAddress: '',
    kemenagOfficeContact: ''
  },
  metadata: {
    period: 'Januari s/d Desember 2026',
    year: '2026',
    assessmentType: 'PKG',
    assessmentDate: '31 Desember 2026',
    cityDate: '31 Desember 2026',
    assessorName: '',
    assessorNip: '',
    assessorRank: '',
    assessorPosition: 'Pengawas Madrasah',
    supervisorName: '',
    supervisorNip: '',
    headmasterName: '',
    headmasterNip: ''
  },
  creditParams: {
    akk: 50,
    akpkb: 3,
    akp: 5,
    jm: 24,
    jwm: 24
  },
  scores: createDefaultScores(0)
};

export const INITIAL_TEACHER_RECORD: TeacherRecord = BLANK_TEACHER_RECORD;

// Sample demo record if user wants to test with 1 click
export const SAMPLE_TEACHERS: TeacherRecord[] = [
  {
    id: 'guru-demo-1',
    updatedAt: new Date().toISOString(),
    teacher: {
      id: 'guru-demo-1',
      name: 'Syarifah Habasyiyah, S.Pd',
      nip: '-',
      nuptk: '-',
      birthPlaceDate: 'Cirebon, 12 Mei 1990',
      rankGrade: 'Guru Tetap Yayasan',
      position: 'Guru Kelas',
      teacherType: 'Guru Kelas',
      teachingAssignment: 'Guru Kelas RA',
      additionalDuty: 'Wali Kelas RA A',
      tmtTeacher: '01 Juli 2018',
      serviceYears: '8 Tahun 0 Bulan',
      gender: 'Perempuan',
      lastEducation: 'S1 PG-PAUD',
      foundationName: 'YAYASAN PENDIDIKAN ISLAM DARUSYIFA',
      schoolName: 'RA DARUSYIFA ARJAWINANGUN',
      nsm: '101232090331',
      npsn: '69781234',
      schoolAddress: 'Jl. Raya Arjawinangun No. 12',
      schoolVillage: 'Arjawinangun',
      schoolDistrict: 'Arjawinangun',
      schoolCity: 'Kabupaten Cirebon',
      schoolProvince: 'Jawa Barat',
      schoolPostalCode: '45162',
      schoolPhone: '0231-356789',
      schoolEmail: 'ra.darusyifa@gmail.com',
      schoolWebsite: '',
      schoolLogoUrl: 'kemenag',
      unitOfWork: 'Kementerian Agama Kabupaten Cirebon',
      workStartDateAtSchool: '01 Juli 2018',
      kemenagOfficeAddress: 'Jalan Sunan Drajat No. 5 Komplek Perkantoran Sumber Cirebon – 45611',
      kemenagOfficeContact: 'e-mail : cirebon@kemenag.go.id , website : cirebon.kemenag.go.id'
    },
    metadata: {
      period: 'Januari s/d Desember 2026',
      year: '2026',
      assessmentType: 'PKG',
      assessmentDate: '31 Desember 2026',
      cityDate: 'Cirebon, 31 Desember 2026',
      assessorName: 'Drs. H. Ahmad Fauzi, M.Pd.I',
      assessorNip: '19750810 200003 1 004',
      assessorRank: 'Pembina / IV/a',
      assessorPosition: 'Pengawas Madrasah',
      supervisorName: 'Drs. H. Ahmad Fauzi, M.Pd.I',
      supervisorNip: '19750810 200003 1 004',
      headmasterName: 'Hj. Nurul Hidayah, M.Pd.',
      headmasterNip: '19800612 200501 2 007'
    },
    creditParams: {
      akk: 50,
      akpkb: 3,
      akp: 5,
      jm: 24,
      jwm: 24
    },
    scores: createDefaultScores(2)
  }
];
