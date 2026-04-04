import { renderHeader, renderFooter } from './header.js'

function ref(n, url) {
  return `<sup><a href="${url}" target="_blank" rel="noopener" class="about-ref">[${n}]</a></sup>`
}

const R = {
  ravensworth:      'https://en.wikipedia.org/wiki/Ravensworth_(plantation)',
  fitzhughWill:     'https://ravensworthstory.org/people/owners/fitzhugh-family/fitzhugh-william-henry-1792-1830/',
  fitzhughFreeBlacks: 'https://ravensworthstory.org/people/enslaved-people/slaves-whfitzhugh-1830/manumissions-whfitzhugh-1850/',
  ravensworthStory: 'https://ravensworthstory.org/landmarks/little-river-turnpike/',
  ravensworthGrant: 'https://ravensworthstory.org/land/ravensworth-landgrant/',
  lrt:          'http://www.novahistory.org/LittleRiverTurnpike/LittleRiverTurnpike.htm',
  lrtWiki:      'https://en.wikipedia.org/wiki/Virginia_State_Route_236',
  gooding:      'https://ravensworthstory.org/landmarks/goodings-tavern/',
  goodingPeter: 'https://ravensworthstory.org/people/owners/gooding-family/gooding-peter-sr/',
  mgrr:         'https://en.wikipedia.org/wiki/Manassas_Gap_Railroad',
  mgrrDHR:      'https://www.dhr.virginia.gov/historic-registers/029-5013/',
  annandale:    'https://www.franconiahistory.com/historic-sites/action-at-annandale-(historical-marker)',
  ildaToday:    'https://annandaletoday.com/ilda-was-a-mixed-race-community-on-little-river-turnpike/',
  ildaBook:     'https://www.upress.virginia.edu/title/5943/',
  ildaCemetery: 'https://www.washingtonpost.com/archive/local/2006/10/01/a-tribute-to-forgotten-souls-span-classbankheadsaved-from-the-bulldozer-civil-war-era-remains-honoredspan/da357e5e-187c-48b9-a939-dafb8da501d1/',
  eakin:        'https://annandaletoday.com/explore-park-eakin-community-park-was/',
  texaco:       'https://www.washingtonpost.com/archive/realestate/1995/08/05/after-oil-spill-life-is-good-again-in-mantua/e222ac6e-d026-4610-92b0-cb84db85e21a/',
  accotink:     'https://en.wikipedia.org/wiki/Accotink_Creek',
  crookBranch:  'https://www.fairfaxcounty.gov/cableconsumer/channel-16/16af-crook-branch-stream-restoration',
  mantua:       'https://en.wikipedia.org/wiki/Mantua,_Virginia',
}

const PAGE = `
<div class="about-hero">
  <p class="about-hero-label">Ridgelea Hills · Fairfax County, Virginia</p>
  <h1 class="about-hero-title">176 homes on 63 acres.<br>The land has a longer story.</h1>
  <p class="about-hero-sub">Halfway between Fairfax City and Annandale along Little River Turnpike, Ridgelea Hills sits on ground that has been fought over, graded for a railroad that never arrived, farmed, and finally subdivided. Most of that history went unrecorded. Some of it was deliberately forgotten.</p>
</div>

<div class="about-body">

  <section class="about-section">
    <p class="about-era">1685 – 1800</p>
    <h2 class="about-section-title">The Largest Land Grant in Fairfax County</h2>
    <p>In 1685, Colonel William Fitzhugh purchased 21,996 acres in a single colonial land grant — the largest in Fairfax County history.${ref(1, R.ravensworthGrant)} The tract, called Ravensworth, covered what is now Annandale, Mantua, and much of the surrounding area. The Fitzhugh family held it for generations, building the Ravensworth mansion in 1796 and operating it with enslaved labor through the antebellum period.</p>
    <p>In 1830, William Henry Fitzhugh died and left an unusual provision in his will: all 83 enslaved people at Ravensworth were to be freed after the year 1850, with expenses paid for relocation wherever they chose to go.${ref(2, R.fitzhughWill)} Beginning in January 1850 — fifteen years before the Civil War — the formerly enslaved began registering as free people in Fairfax County Court. Sixty-one registered over the following year; the remainder had died or been sold in the two decades since Fitzhugh's death.${ref(3, R.fitzhughFreeBlacks)}</p>
  </section>

  <section class="about-section">
    <p class="about-era">1802 – 1861</p>
    <h2 class="about-section-title">The Road That Built the Region</h2>
    <p>Little River Turnpike — the road that runs along the southern edge of our neighborhood — was chartered in 1802 and completed by 1811. Built largely by enslaved laborers, it ran nearly 34 miles from Alexandria to Loudoun County and was among the earliest toll roads in America.${ref(4, R.lrt)} Seven gates collected fees at five-mile intervals for nearly sixty years.${ref(5, R.lrtWiki)}</p>
    <p>At the ten-mile mark from Alexandria — a point near what is now the NOVA Annandale campus — William Gooding Jr. opened a tavern in 1807 and ran it for 54 years until his death in 1861.${ref(6, R.gooding)} He added a blacksmith shop and stables across the road in 1835. The Ten Mile House was a waystation for everyone moving between Alexandria and the Shenandoah Valley: farmers, merchants, soldiers, and people escaping slavery.</p>
    <div class="about-pull">
      "With the well-mapped Little River Turnpike probably used as a route for troop movement, it is possible to believe the stories of Civil War casings and memorabilia being found on our land."
      <cite>— Jacqueline Carroll, <em>Ridgelea Hills History</em>, 25th Anniversary</cite>
    </div>
    <p>William's son Peter accumulated 895 acres in the area by 1853 — the Gooding family controlled the crossroads entirely.${ref(7, R.goodingPeter)}</p>
  </section>

  <section class="about-section">
    <p class="about-era">1851 – 1857</p>
    <h2 class="about-section-title">The Railroad That Never Came</h2>
    <p>In 1853, the Manassas Gap Railroad was authorized to build a spur through Fairfax County — the "Independent Line" — running from Alexandria east through Annandale and Fairfax City toward a junction in Prince William County.${ref(8, R.mgrrDHR)} Grading began in September 1854. The route passed through the Gooding property and close to, or across, what is now the northern edge of Ridgelea Hills — historical maps document the alignment but the exact line is not precisely established.${ref(7, R.goodingPeter)}</p>
    <p>Peter Gooding and his father fought the condemnation in Fairfax County Court with counter-suits that dragged on for years. They lost.${ref(7, R.goodingPeter)} The land was taken. Rails were surveyed, grades were cut, stone bridge abutments were constructed over Indian Run creek. And then, in 1857, the money ran out. The railroad never laid a single rail on the Independent Line. The project was abandoned, and the Civil War ended it permanently.${ref(9, R.mgrr)}</p>
    <p>The stone abutments from those 1850s bridge piers are still standing today in Poe Terrace Park in Annandale.${ref(8, R.mgrrDHR)} The graded roadbed — the railroad that never arrived on land the Goodings died fighting to keep — can still be traced.</p>
    <div class="about-pull">
      "Portions of the original embankments are still discernible as close as Woodburn Road."
      <cite>— Jacqueline Carroll, <em>Ridgelea Hills History</em></cite>
    </div>
  </section>

  <section class="about-section">
    <p class="about-era">1861 – 1865</p>
    <h2 class="about-section-title">The War Comes to Little River Turnpike</h2>
    <p>On December 2, 1861, approximately 200 Confederate cavalrymen crossed Little River Turnpike at the exact point where the unfinished railroad grade intersected the road — a few miles from what is now Ridgelea Hills. They overran a Union barricade held by the 45th New York Volunteers. Reinforcements arrived from the 32nd New York; the Confederates retreated west. One Union soldier was killed, two Confederates killed, two captured.${ref(10, R.annandale)}</p>
    <p>The unfinished railroad grade, ironically, became a military asset. After the Second Battle of Bull Run in August 1862, Confederate forces used the unfinished railroad grade as defensive earthworks — the infrastructure of a failed industrial dream repurposed for war.${ref(9, R.mgrr)}</p>
    <p>On August 24, 1863, Confederate partisan Major John S. Mosby was severely wounded at Gooding's Tavern in a skirmish with the 2nd Massachusetts Cavalry. Two of his officers were killed.${ref(6, R.gooding)} Union forces were encamped throughout the area. The Annandale Methodist Church, built in 1846, was stripped for firewood and burned by departing Union troops.${ref(10, R.annandale)}</p>
  </section>

  <section class="about-section">
    <p class="about-era">1868 – 1930s</p>
    <h2 class="about-section-title">Ilda: The Story That Was Almost Lost</h2>
    <p>After the Civil War, Peter Gooding's widow Margarette began selling off parcels of the family's land. In 1868, she sold five acres near Guinea Road and Little River Turnpike to a man named Horace Gibson for $150 — thirty dollars an acre. Gibson was a formerly enslaved blacksmith and wheelwright from Culpeper County who had come to Fairfax County after Emancipation.${ref(11, R.ildaToday)}</p>
    <p>The following year, Moses Parker — another freed man with the same trade — purchased six adjacent acres. Gibson and Parker set up a blacksmith and wheelwright shop on the turnpike, directly across the road from where William Gooding's blacksmith shop had stood for decades. They were stepping into the same trade, at the same crossroads, on land sold cheaply by the family that had once worked it with enslaved labor.${ref(11, R.ildaToday)}</p>
    <div class="about-pull">
      The community was named "Ilda" after Matilda Gibson — Horace's daughter — whose name was compressed into a new word by the people who lived there.${ref(12, R.ildaBook)}
    </div>
    <p>By the 1890s, Gibson had turned his $150 investment into 158 acres valued over $8,000. The community he founded — Ilda — was recognized by the U.S. Post Office in 1903 and appeared on federal maps by 1915. It was a genuinely integrated community for its era: Black and white families trading together, Black-owned businesses at its economic center.${ref(11, R.ildaToday)}</p>
    <p>But two public schools built in Ilda served white children only. No school was ever built for the Black children of the community. Jim Crow slowly squeezed the life out of Ilda over the following decades.${ref(12, R.ildaBook)}</p>
    <p>Beneath it all, something worse was hidden. An African American cemetery near the crossroads — dating to the 1840s and 1870s, with burials showing evidence of malnourishment and hard labor, hexagonal pine coffins and Civil War-era buttons — may have held the remains of people enslaved on the Gooding property itself. When VDOT posted signs in 2004 seeking information before a road-widening project, a Vietnam veteran named Dennis Howard came forward. He had been searching for his ancestors for thirty years. Archaeological investigation found more than 30 burials — 15 children, 11 adult women, 6 adult men. They were reinterred in 2008 at Pleasant Valley Memorial Cemetery on Little River Turnpike.${ref(13, R.ildaCemetery)}</p>
    <p>In 2024, journalist Tom Shoop published <em>A Place Called Ilda: Race and Resilience at a Northern Virginia Crossroads</em> (University of Virginia Press) — the first full account of the community and its people.${ref(12, R.ildaBook)}</p>
  </section>

  <section class="about-section">
    <p class="about-era">1939 – 1974</p>
    <h2 class="about-section-title">The Suburb Arrives</h2>
    <p>In 1939, a developer named LeRoy Eakin purchased the remaining farmland in the area through Eakin Properties Inc. and began platting the Mantua and Pine Ridge subdivisions. When Fairfax County created its Park Authority in 1950, Eakin donated the first 14 acres the following year — becoming the county's first public park. Over subsequent decades the family donated more than 240 additional acres.${ref(14, R.eakin)}</p>
    <p>The postwar numbers were staggering: Fairfax County's population grew from 98,557 in 1950 to 248,897 in 1960 — more than doubling in a single decade — driven by federal government expansion and the Pentagon's enormous workforce.${ref(15, R.mantua)} By 1978, Annandale alone had 68,400 residents at 4,275 people per square mile.</p>
    <p>In 1965, a petroleum distribution plant opened on Pickett Road. For up to 25 years, it quietly leaked approximately 200,000 gallons into Crook Branch Creek — the stream that runs through Mantua and borders our neighborhood. The leak was discovered in 1990. Four families were evacuated. A hundred homes were connected to public water. Texaco eventually settled; part of the settlement funded the technology lab at Mantua Elementary School. EPA remediation ran until 2016.${ref(16, R.texaco)}</p>
  </section>

  <section class="about-section">
    <p class="about-era">1975 – 1989</p>
    <h2 class="about-section-title">Ridgelea Hills Is Built</h2>
    <p>In June 1972, developers Marshall Racoosin and Ellis Barron purchased a tract along Little River Turnpike from Michael Troiano — land that had once been part of the Troiano farm, and before that the Manassas Gap Railroad right-of-way that Peter Gooding had lost in court. A year later they acquired an adjoining strip known as "Section 4 of Pine Ridge," formerly the Eakin property. Together these parcels would become Ridgelea Hills.</p>
    <p>The name likely came from the neighboring Ridgelea Estates, which Racoosin was also developing. Ground was broken in 1975 by his company, Associated Builders, Inc. Four furnished models opened on Southlea Court in early 1976. The first residents — Ben and Martha Scarbrough, and Ed and Gloria Baroody — moved onto Sandy Ridge Court in June and July of 1976.</p>
    <p>Development proceeded steadily until Marshall Racoosin died suddenly in early 1981, leaving half-poured foundations on the back portion of Ridgelea Drive standing unfinished. His son Mitchell took over. Building resumed in 1982 with updated designs — master bathrooms enlarged, whirlpool tubs added, floor plans expanded. By 1987, the original model designs had been largely abandoned for much larger homes on the upper portions of Sandalwood and Laro Courts.</p>
    <p>In late 1987, the Fairfax County Fire Department conducted a controlled burn of the old barn at the corner of Ridgelea Drive and Southlea Court — a structure that had stored building supplies for over a decade. The last homes in Ridgelea Hills were built on its footprint. By the end of 1989, the community was complete: 176 homes on 63.06 acres.</p>
    <div class="about-pull">
      "With improvements by both residents and nature, Ridgelea Hills continues today as a prestige Fairfax County address, just as it was back in 1975."
      <cite>— Jacqueline Carroll, <em>Ridgelea Hills History</em></cite>
    </div>
  </section>

  <section class="about-section">
    <p class="about-era">Today</p>
    <h2 class="about-section-title">The Neighborhood Now</h2>
    <p>Ridgelea Hills sits about 16 miles from Washington, D.C. and 9 miles from Tysons Corner. The 176 homes vary significantly in layout and architectural style, most on quarter- to third-acre lots on hilly terrain. The neighborhood is bordered by wooded common areas and Crook Branch Creek, which feeds into the Accotink Creek system.${ref(17, R.accotink)} A central pond off Sandalwood and Laro Courts anchors the common area.</p>
    <p>Nearby parks include Accotink Stream Valley Park, Eakin Community Park, Rutherford Park, Long Branch Stream Valley Park, and Long Branch Park — most connected by the Accotink Creek wildlife corridor, one of the finest in Fairfax County. The creek restoration at Mantua Elementary, completed in 2023, repaired decades of urban damage to Crook Branch.${ref(18, R.crookBranch)}</p>
    <p>Students attend Mantua Elementary School, Frost Middle School, and Woodson High School.</p>
  </section>

  <section class="about-books">
    <h2 class="about-books-title">Further Reading</h2>
    <div class="about-book-grid">
      <a href="https://www.amazon.com/Place-Called-Ilda-Resilience-Crossroads/dp/0813950864" target="_blank" rel="noopener" class="about-book">
        <p class="about-book-title">A Place Called Ilda</p>
        <p class="about-book-author">Tom Shoop · UVA Press, 2024</p>
        <p class="about-book-desc">Covers the founding of the Ilda community by Horace Gibson and Moses Parker after the Civil War, the Guinea Road cemetery and its rediscovery, and the area's transition through the 20th century. University of Virginia Press, 2024.</p>
      </a>
      <div class="about-book">
        <p class="about-book-title">Ridgelea Hills History</p>
        <p class="about-book-author">Jacqueline Carroll · 25th Anniversary Edition</p>
        <p class="about-book-desc">Written for the neighborhood's 25-year anniversary. Traces the land from the Manassas Gap Railroad and Civil War through the Racoosin development and the first families who moved to Sandy Ridge Court in 1976. Contact the neighborhood association for copies.</p>
      </div>
    </div>
  </section>

  <section class="about-references">
    <h2 class="about-ref-title">References</h2>
    <ol class="about-ref-list">
      <li><a href="${R.ravensworthGrant}" target="_blank" rel="noopener">Ravensworth Land Grant — The Story of Ravensworth</a></li>
      <li><a href="${R.fitzhughWill}" target="_blank" rel="noopener">William Henry Fitzhugh (1792–1830) — The Story of Ravensworth</a></li>
      <li><a href="${R.fitzhughFreeBlacks}" target="_blank" rel="noopener">Free Blacks Manumitted by William Henry Fitzhugh — The Story of Ravensworth</a></li>
      <li><a href="${R.lrt}" target="_blank" rel="noopener">Little River Turnpike Construction — NOVA History</a></li>
      <li><a href="${R.lrtWiki}" target="_blank" rel="noopener">Virginia State Route 236 — Wikipedia</a></li>
      <li><a href="${R.gooding}" target="_blank" rel="noopener">Gooding's Tavern — Ravensworth Story</a></li>
      <li><a href="${R.goodingPeter}" target="_blank" rel="noopener">Peter Gooding Sr. — Ravensworth Story</a></li>
      <li><a href="${R.mgrrDHR}" target="_blank" rel="noopener">Manassas Gap Railroad Independent Line — Virginia DHR</a></li>
      <li><a href="${R.mgrr}" target="_blank" rel="noopener">Manassas Gap Railroad — Wikipedia</a></li>
      <li><a href="${R.annandale}" target="_blank" rel="noopener">Action at Annandale — Franconia History</a></li>
      <li><a href="${R.ildaToday}" target="_blank" rel="noopener">Ilda: A Mixed-Race Community on Little River Turnpike — Annandale Today</a></li>
      <li><a href="${R.ildaBook}" target="_blank" rel="noopener">A Place Called Ilda — University of Virginia Press</a></li>
      <li><a href="${R.ildaCemetery}" target="_blank" rel="noopener">A Tribute to Forgotten Souls: Civil War-Era Remains Honored — Washington Post, 2006</a></li>
      <li><a href="${R.eakin}" target="_blank" rel="noopener">Eakin Community Park — Annandale Today</a></li>
      <li><a href="${R.mantua}" target="_blank" rel="noopener">Mantua, Virginia — Wikipedia</a></li>
      <li><a href="${R.texaco}" target="_blank" rel="noopener">After Oil Spill, Life Is Good Again in Mantua — Washington Post, 1995</a></li>
      <li><a href="${R.accotink}" target="_blank" rel="noopener">Accotink Creek — Wikipedia</a></li>
      <li><a href="${R.crookBranch}" target="_blank" rel="noopener">Crook Branch Stream Restoration — Fairfax County Channel 16</a></li>
    </ol>
  </section>

</div>
`

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])
  document.getElementById('about-page').innerHTML = PAGE
}

init()
