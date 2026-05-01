export interface EroFieldOffice {
  name: string;
  address: string;
}

export const eroFieldOffices: EroFieldOffice[] = [
  { name: "Atlanta Field Office", address: "180 Ted Turner Dr. SW Suite 522, Atlanta, GA 30303" },
  { name: "Baltimore Field Office", address: "31 Hopkins Plaza 6th Floor, Baltimore, MD 21201" },
  { name: "Boston Field Office", address: "1000 District Avenue, Burlington, MA 01803" },
  { name: "Buffalo Field Office", address: "250 Delaware Avenue, Floor 7, Buffalo, NY 14202" },
  { name: "Chicago Field Office", address: "101 W Ida B Wells Drive Suite 4000, Chicago, IL 60605" },
  { name: "Dallas Field Office", address: "8101 N. Stemmons Frwy, Dallas, TX 75247" },
  { name: "Denver Field Office", address: "12445 E. Caley Avenue, Centennial, CO 80111" },
  { name: "Detroit Field Office", address: "985 Michigan Avenue Suite 207, Detroit, MI 48226" },
  { name: "El Paso Field Office", address: "11541 Montana Ave Suite E, El Paso, TX 79936" },
  { name: "Harlingen Field Office", address: "1717 Zoy Street, Harlingen, TX 78552" },
  { name: "Houston Field Office", address: "126 Northpoint Drive, Houston, TX 77060" },
  { name: "Los Angeles Field Office", address: "300 North Los Angeles St. Room 7631, Los Angeles, CA 90012" },
  { name: "Miramar Sub Office", address: "2805 SW 145th Ave, Miramar, FL 33027" },
  { name: "New Orleans Field Office", address: "181 James Drive W, St. Rose, LA 70087" },
  { name: "New York City Field Office", address: "26 Federal Plaza 9th Floor, Suite 9-110, New York, NY 10278" },
  { name: "Newark Field Office", address: "970 Broad St. 11th Floor, Newark, NJ 07102" },
  { name: "Philadelphia Field Office", address: "114 North 8th Street, Philadelphia, PA 19107" },
  { name: "Phoenix Field Office", address: "2035 N. Central Avenue, Phoenix, AZ 85004" },
  { name: "Salt Lake City Field Office", address: "2975 Decker Lake Drive Suite 100, West Valley City, UT 84119-6096" },
  { name: "San Antonio Field Office", address: "1777 NE Loop 410 Floor 15, San Antonio, TX 78217" },
  { name: "San Diego Field Office", address: "880 Front Street #2242, San Diego, CA 92101" },
  { name: "San Francisco Field Office", address: "630 Sansome Street Rm 590, San Francisco, CA 94111" },
  { name: "Seattle Field Office", address: "12500 Tukwila International Boulevard, Seattle, WA 98168" },
  { name: "St Paul Field Office", address: "1 Federal Drive Suite 1601, Fort Snelling, MN 55111" },
  { name: "Washington Field Office", address: "14797 Murdock Street Mail Stop 5216, Chantilly, VA 20598-5216" },
];

export function getEroFieldOfficeAddress(name: string): string | undefined {
  const office = eroFieldOffices.find(
    (o) => o.name.toLowerCase() === name.toLowerCase()
  );
  return office?.address;
}
