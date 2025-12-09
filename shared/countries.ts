export const countries = [
  "ទាំងអស់",
  "ខ្មែរ",
  "សៀម",
  "ម៉ាឡេស៊ី",
  "វៀតណាម",
  "ឥណ្ឌូនេស៊ី",
  "អាមេរិក",
  "កូរ៉េ",
  "ឥណ្ឌា",
  "ភីលីពីន",
  "ចិន",
  "ជប៉ុន",
  "ផ្សេងៗ"
];

// Country mapping: Khmer to English (for database)
export const countryMapping: { [key: string]: string } = {
  "ទាំងអស់": "All",
  "ខ្មែរ": "Cambodia",
  "សៀម": "Thailand",
  "ម៉ាឡេស៊ី": "Malaysia",
  "វៀតណាម": "Vietnam",
  "ឥណ្ឌូនេស៊ី": "Indonesia",
  "អាមេរិក": "USA",
  "កូរ៉េ": "Korea",
  "ឥណ្ឌា": "India",
  "ភីលីពីន": "Philippines",
  "ចិន": "China",
  "ជប៉ុន": "Japan",
  "ផ្សេងៗ": "Other"
};

// Reverse mapping: English to Khmer (for display)
export const englishToKhmerCountry: { [key: string]: string } = {
  "All": "ទាំងអស់",
  "Cambodia": "ខ្មែរ",
  "Thailand": "សៀម",
  "Malaysia": "ម៉ាឡេស៊ី",
  "Vietnam": "វៀតណាម",
  "Indonesia": "ឥណ្ឌូនេស៊ី",
  "USA": "អាមេរិក",
  "Korea": "កូរ៉េ",
  "India": "ឥណ្ឌា",
  "Philippines": "ភីលីពីន",
  "China": "ចិន",
  "Japan": "ជប៉ុន",
  "Other": "ផ្សេងៗ"
};
