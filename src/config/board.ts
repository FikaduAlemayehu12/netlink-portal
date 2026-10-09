export interface BoardMember {
  name: string;
  role: string;
  phone: string; // exactly as supplied
}

export const BOARD_MEMBERS: BoardMember[] = [
  { name: "Mrs. Selam Asmelash Kasa", role: "Chairperson", phone: "+251 91 407 4489" },
  { name: "Mr. Agegnehu Asnakew Admassie", role: "Vice Chairperson", phone: "+251 96 531 1037" },
  { name: "Mr. Fikadu Alemayehu Bekele", role: "Secretary", phone: "+252 916 690 051" },
  { name: "Mr. Feyisa Bekele Wondimu", role: "Treasurer", phone: "+251934250688" },
];

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
