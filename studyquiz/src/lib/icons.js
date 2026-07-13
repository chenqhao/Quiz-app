import { BooksIcon, CalculatorIcon, MicroscopeIcon, DnaIcon, PaletteIcon, BankIcon, LaptopIcon, GlobeIcon, StrategyIcon, MusicNotesIcon, ScalesIcon, BriefcaseIcon, BrainIcon, ChartBarIcon, WrenchIcon } from '@phosphor-icons/react';

const ICON_MAP = {
  'Books': BooksIcon,
  'Calculator': CalculatorIcon,
  'Microscope': MicroscopeIcon,
  'Dna': DnaIcon,
  'Palette': PaletteIcon,
  'Bank': BankIcon,
  'Laptop': LaptopIcon,
  'Globe': GlobeIcon,
  'Strategy': StrategyIcon,
  'MusicNotes': MusicNotesIcon,
  'Scales': ScalesIcon,
  'Briefcase': BriefcaseIcon,
  'Brain': BrainIcon,
  'ChartBar': ChartBarIcon,
  'Wrench': WrenchIcon,
  '📚': BooksIcon,
  '🧮': CalculatorIcon,
  '🔬': MicroscopeIcon,
  '🧬': DnaIcon,
  '🎨': PaletteIcon,
  '🏛️': BankIcon,
  '💻': LaptopIcon,
  '🌍': GlobeIcon,
  '📐': StrategyIcon,
  '🎵': MusicNotesIcon,
  '⚖️': ScalesIcon,
  '💼': BriefcaseIcon,
  '🧠': BrainIcon,
  '📊': ChartBarIcon,
  '🔧': WrenchIcon,
};

export const ICONS = ['Books', 'Calculator', 'Microscope', 'Dna', 'Palette', 'Bank', 'Laptop', 'Globe', 'Strategy', 'MusicNotes', 'Scales', 'Briefcase', 'Brain', 'ChartBar', 'Wrench'];

export function renderIcon(iconName) {
  const IconComponent = ICON_MAP[iconName] || Books;
  return <IconComponent weight="fill" />;
}
