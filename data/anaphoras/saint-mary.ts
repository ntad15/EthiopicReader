import { Anaphora } from '../types';

const anaphora: Anaphora = {
  id: 'saint-mary',
  name: {
    english: 'St. Mary',
    geez: 'ቅድስት ድንግል ማርያም',
    amharic: 'ቅድስት ድንግል ማርያም',
  },
  sections: [
    {
      id: 'saint-mary-placeholder',
      title: { english: 'Coming Soon' },
      blocks: [
        {
          id: 'saint-mary-placeholder-1',
          type: 'rubric',
          english: '[Placeholder — contribute the full text via a Pull Request on GitHub]',
        },
      ],
    },
  ],
};

export default anaphora;
