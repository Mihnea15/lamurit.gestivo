/** Link to www.gestivo.ro tagged with UTM params so referrals from Lămurit show up in analytics. */
export function gestivoUrl(placement: string): string {
  return `https://www.gestivo.ro/?utm_source=lamurit&utm_medium=referral&utm_campaign=${placement}`;
}
