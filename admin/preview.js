(function () {
  const cms = window.CMS;
  const createClass = window.createClass;
  const h = window.h;

  if (!cms || !createClass || !h) {
    throw new Error('Decap CMS preview APIs are unavailable.');
  }

  cms.registerPreviewStyle('/site.css');
  cms.registerPreviewStyle('/admin/preview.css');

  const value = (object, key, fallback) => object && object[key] != null && object[key] !== '' ? object[key] : fallback;
  const list = items => Array.isArray(items) ? items : [];
  const imageUrl = url => {
    const source = String(url || '').trim();
    return /^(https?:\/\/|\/|[\w.-]+\/)/i.test(source) && !/^javascript:/i.test(source) ? source : '';
  };
  const image = (url, alt, className) => {
    const src = imageUrl(url);
    return src ? h('img', { className, src, alt: alt || '' }) : null;
  };

  function header(settings) {
    const site = settings || {};
    const details = site.header || {};
    const links = list(details.nav_links);
    const brandColor = value(site, 'brand_color', '#7E9F7E');
    const logo = image(details.logo_image, value(details, 'logo_text', 'Blackberry'), '');
    return h('header', { className: 'preview-header' }, [
      h('div', { className: 'preview-brand' }, [
        h('div', { className: 'preview-logo', style: { backgroundColor: brandColor } }, logo || h('i', { className: value(details, 'logo_icon', 'fa-solid fa-paw') })),
        h('div', {}, [
          value(details, 'logo_text', value(site, 'site_name', 'Blackberry')),
          h('small', {}, value(details, 'logo_tagline', 'Luxury Grooming'))
        ])
      ]),
      h('nav', { className: 'preview-nav' }, links.map(item => h('span', {}, item.label))),
      h('span', { className: 'preview-button', style: { backgroundColor: brandColor } }, value(details, 'header_button_text', 'Book Appointment'))
    ]);
  }

  function pageSection(title, eyebrow, children, style) {
    return h('section', { className: 'preview-section', style: style || {} }, [
      eyebrow ? h('p', { className: 'preview-section-heading' }, eyebrow) : null,
      title ? h('h1', { className: 'preview-title' }, title) : null,
      children
    ]);
  }

  function hero(data, settings) {
    const top = value(data, 'background_top', '#FDFBF7');
    const bottom = value(data, 'background_bottom', '#F4F7F4');
    const brandColor = value(settings, 'brand_color', '#7E9F7E');
    const stats = list(data.stats).slice(0, 4);
    const cards = [data.card_1, data.card_2].filter(card => card && card.show !== false);
    return pageSection(null, null, h('div', { className: 'preview-hero-layout' }, [
      h('div', {}, [
        data.show_badge === false ? null : h('span', {
          className: 'preview-pill',
          style: { backgroundColor: value(data, 'badge_bg_color', '#E3EBE3'), color: value(data, 'badge_text_color', '#4C684C') }
        }, [
          h('i', { className: value(data, 'badge_icon', 'fa-solid fa-sparkles'), style: { color: value(data, 'badge_icon_color', '#F4A261') } }),
          ' ',
          value(data, 'badge_text', 'Certified Stress-Free Pet Spa')
        ]),
        h('h1', { className: 'preview-title', style: { color: value(data, 'title_color', '#4B5320') } }, value(data, 'title', 'Gentle Care & Premium Pampering for Your Best Friend.')),
        h('p', { className: 'preview-copy', style: { color: value(data, 'subtitle_color', '#57534E') } }, value(data, 'subtitle', 'Personalized, low-stress grooming for your best friend.')),
        h('div', { className: 'preview-actions' }, [
          h('span', {
            className: 'preview-button',
            style: { backgroundColor: value(data, 'primary_button_color', brandColor), color: value(data, 'primary_button_text_color', '#FFFFFF') }
          }, value(data, 'primary_button_text', 'Book Your Dog’s Visit')),
          h('span', {
            className: 'preview-button preview-button-secondary',
            style: { backgroundColor: value(data, 'secondary_button_color', '#FFFFFF'), color: value(data, 'secondary_button_text_color', '#5C3D2E') }
          }, value(data, 'secondary_button_text', 'Estimate Groom Price'))
        ]),
        h('div', { className: 'preview-stats' }, stats.map(stat => h('div', {}, [
          h('strong', { style: { color: value(stat, 'value_color', '#4B5320') } }, value(stat, 'value', '')),
          h('div', { className: 'preview-muted', style: { color: value(data, 'stat_label_color', '#78716C') } }, value(stat, 'label', ''))
        ])))
      ]),
      h('div', { className: 'preview-hero-photo' }, [
        image(data.image, value(data, 'image_alt', 'Happy freshly groomed dog'), 'preview-image'),
        h('div', { className: 'preview-floating-cards' }, cards.map(card => h('div', { className: 'preview-card' }, [
          h('strong', {}, value(card, 'text', 'Gentle, personal care')),
          h('div', { className: 'preview-muted' }, value(card, 'label', ''))
        ])))
      ])
    ]), { background: `linear-gradient(135deg, ${top}, ${bottom})` });
  }

  function services(data) {
    const cards = list(data.items).map(item => h('article', { className: 'preview-card' }, [
      item.badge ? h('span', { className: 'preview-pill' }, item.badge) : null,
      h('div', { className: 'preview-service-icon' }, h('i', { className: value(item, 'icon_class', 'fa-solid fa-paw') })),
      h('h3', {}, value(item, 'title', 'Grooming package')),
      h('p', { className: 'preview-copy' }, value(item, 'description', '')),
      h('div', {}, [
        h('strong', { className: 'preview-price' }, `$${value(item, 'base_price', '')}`),
        h('span', { className: 'preview-muted' }, ` ${value(item, 'price_note', '/ session')}`)
      ]),
      h('ul', { className: 'preview-features' }, list(item.features).map(feature =>
        h('li', {}, `✓ ${typeof feature === 'string' ? feature : value(feature, 'feature_text', '')}`)
      )),
      h('span', { className: 'preview-button' }, 'Book Appointment')
    ]));
    return pageSection('Grooming Services & Rates', 'Thoughtful care for every pup', h('div', { className: 'preview-grid' }, cards));
  }

  function estimator(data) {
    const display = data.display || {};
    const components = data.components || {};
    const controlGroup = (label, items, itemLabel) => h('div', { className: 'preview-control-group' }, [
      h('strong', {}, label),
      h('div', { className: 'preview-pills' }, list(items).map(item =>
        h('span', { className: 'preview-pill' }, value(item, itemLabel, 'Option'))
      ))
    ]);
    return pageSection(value(display, 'title', 'Interactive Grooming Cost Estimator'), value(display, 'eyebrow', 'Instant Quote Tool'), h('div', {
      className: 'preview-estimator-layout',
      style: { backgroundColor: value(display, 'panel_bg_color', '#FDFBF7') }
    }, [
      h('div', {}, [
        h('p', { className: 'preview-copy' }, value(display, 'description', '')),
        controlGroup(value(display, 'size_label', 'Select Dog Size'), components.sizes, 'name'),
        controlGroup(value(display, 'coat_label', 'Coat Type'), components.coats, 'name'),
        controlGroup(value(display, 'appt_label', 'Appointment Type'), components.appointments, 'name'),
        controlGroup(value(display, 'addon_label', 'Optional Add-ons'), components.addons, 'title')
      ]),
      h('div', { className: 'preview-dark-card', style: { background: `linear-gradient(135deg, ${value(display, 'card_color_top', '#7F5539')}, ${value(display, 'card_color_bottom', '#5C3D2E')})` } }, [
        h('div', { className: 'preview-section-heading', style: { color: value(display, 'total_label_color', '#E9C46A'), textAlign: 'left' } }, value(display, 'total_label', 'Estimated Total')),
        h('strong', { className: 'preview-price', style: { color: value(display, 'price_color', '#FFFFFF') } }, `${value(display, 'currency_symbol', '$')}95`),
        h('div', { className: 'preview-muted', style: { color: value(display, 'card_muted_color', '#F2EBD9') } }, value(display, 'price_note', '*base estimate')),
        h('p', {}, `${value(display, 'included_label', 'Included:')} ${value(display, 'included_text', 'Nails, Ears & Warm Bath')}`),
        h('span', { className: 'preview-button', style: { backgroundColor: value(display, 'button_color', '#F4A261'), color: value(display, 'button_text_color', '#1C1917') } }, value(display, 'button_text', 'Book This Custom Estimate')),
        h('p', { className: 'preview-muted' }, value(display, 'disclaimer', ''))
      ])
    ]), { backgroundColor: value(display, 'section_bg_color', '#FFFFFF') });
  }

  function gallery(data) {
    const display = data.display || {};
    const cards = list(data.items).map(item => h('article', { className: 'preview-card' }, [
      h('div', { className: 'preview-before-after' }, [
        image(item.image_before, `${value(item, 'pup_name', 'Pup')} before grooming`, 'preview-gallery-image'),
        image(item.image_after, `${value(item, 'pup_name', 'Pup')} after grooming`, 'preview-gallery-image')
      ]),
      h('h3', {}, value(item, 'pup_name', 'Happy pup'))
    ]));
    return pageSection(value(display, 'title', 'Happy Pups Before & After'), value(display, 'eyebrow', 'Transformation Gallery'), h('div', {}, [
      h('p', { className: 'preview-copy preview-centered', style: { color: value(display, 'description_color', '#57534E') } }, value(display, 'description', '')),
      h('div', { className: 'preview-grid' }, cards)
    ]));
  }

  function reviews(data) {
    const display = data.display || {};
    const cards = list(data.items).map(item => {
      const rating = Math.min(5, Math.max(0, Number(item.rating) || 5));
      return h('article', { className: 'preview-card', style: { backgroundColor: value(display, 'card_bg_color', '#FFFFFF') } }, [
        h('div', { className: 'preview-review-stars', style: { color: value(display, 'star_color', '#FBBF24') } }, '★'.repeat(rating)),
        h('blockquote', { className: 'preview-copy', style: { color: value(display, 'review_text_color', '#57534E') } }, `“${value(item, 'review_text', '')}”`),
        h('strong', { style: { color: value(display, 'name_color', '#292524') } }, value(item, 'owner_name', 'Pet parent')),
        h('div', { className: 'preview-muted', style: { color: value(display, 'pet_info_color', '#78716C') } }, value(item, 'pet_info', ''))
      ]);
    });
    return pageSection(value(display, 'title', 'What Dog Owners Say'), value(display, 'eyebrow', 'Loved by Pet Parents'), h('div', { className: 'preview-grid' }, cards));
  }

  function about(data) {
    const principles = list(data.principles);
    return pageSection(value(data, 'heading', 'Meet Your Groomer'), value(data, 'eyebrow', 'A little about us'), h('div', { className: 'preview-about-layout' }, [
      h('div', {}, [
        h('p', { className: 'preview-copy', style: { color: value(data, 'bio_color', '#57534E'), whiteSpace: 'pre-line' } }, value(data, 'bio', '')),
        h('div', { className: 'preview-grid' }, principles.map(item => h('article', { className: 'preview-card' }, [
          h('i', { className: value(item, 'icon', 'fa-solid fa-paw') }),
          h('h3', {}, value(item, 'title', '')),
          h('p', { className: 'preview-copy' }, value(item, 'desc', ''))
        ])))
      ]),
      h('div', { className: 'preview-about-photos' }, [
        image(data.image_1, value(data, 'image_1_alt', ''), 'preview-image'),
        image(data.image_2, value(data, 'image_2_alt', ''), 'preview-image')
      ])
    ]), { backgroundColor: value(data, 'section_bg_color', '#FFFFFF') });
  }

  function settings(data) {
    const site = data || {};
    const details = site.header || {};
    return h('div', {}, [
      header(site),
      pageSection(value(details, 'logo_text', value(site, 'site_name', 'Blackberry Luxury Grooming')), 'Customer-facing navigation preview', h('p', { className: 'preview-copy preview-centered' }, 'This is how your site header and navigation appear to visitors.'))
    ]);
  }

  function loadContent(name) {
    return fetch(`/content/${name}.json`, { cache: 'no-store' }).then(response => {
      if (!response.ok) throw new Error(`Could not load content/${name}.json: HTTP ${response.status}`);
      return response.json();
    });
  }

  function footer(data) {
    const hours = list(data.hours);
    const links = list(data.social_links);
    const background = value(data, 'bg_color', '#5C3D2E');
    return h('footer', { className: 'preview-footer', style: { backgroundColor: background, color: value(data, 'text_color', '#F9F5EC') } }, [
      h('div', { className: 'preview-footer-layout' }, [
        h('div', {}, [
          h('strong', { style: { color: value(data, 'heading_color', '#FFFFFF') } }, value(data, 'brand_name', 'Blackberry Luxury Grooming')),
          h('p', {}, value(data, 'description', '')),
          data.show_tag === false ? null : h('span', { className: 'preview-pill', style: { backgroundColor: value(data, 'tag_bg_color', background), color: value(data, 'tag_text_color', '#FCD34D') } }, value(data, 'tag_text', ''))
        ]),
        h('div', {}, [
          h('strong', { style: { color: value(data, 'heading_color', '#FFFFFF') } }, value(data, 'hours_title', 'Hours & Days')),
          ...hours.map(item => h('p', {}, `${value(item, 'label', '')} ${value(item, 'hours', '')}`))
        ]),
        h('div', {}, [
          h('strong', { style: { color: value(data, 'heading_color', '#FFFFFF') } }, value(data, 'contact_title', 'Contact & Location')),
          h('p', {}, value(data, 'address', '')),
          h('p', {}, value(data, 'phone', '')),
          ...links.map(item => h('span', { className: 'preview-footer-link' }, `${value(item, 'platform', '')}  `))
        ])
      ]),
      h('hr', { style: { borderColor: value(data, 'divider_color', '#7F5539') } }),
      value(data, 'copyright_text', '© {year} {site}. All rights reserved.').replace('{year}', String(new Date().getFullYear())).replace('{site}', value(data, 'brand_name', 'Blackberry Luxury Grooming'))
    ]);
  }

  const templates = {
    hero,
    settings,
    footer,
    services,
    estimator,
    gallery,
    reviews,
    about
  };

  Object.keys(templates).forEach(name => {
    const Preview = createClass({
      render: function () {
        const entry = this.props.entry;
        const data = entry && entry.get('data') ? entry.get('data').toJS() : {};
        const settingsData = name === 'settings' ? data : this.state.settings;
        const footerData = name === 'footer' ? data : this.state.footer;
        const content = templates[name](data, settingsData);
        const isSettings = name === 'settings';
        return h('div', { className: 'site-preview' }, [
          h('div', { className: 'preview-label' }, 'Blackberry Luxury Grooming · Live content preview'),
          h('div', {
            className: 'preview-page',
            style: {
              '--preview-brand': value(settingsData, 'brand_color', '#7E9F7E'),
              '--heading-color': value(settingsData, 'heading_color', '#4B5320')
            }
          }, [
            isSettings ? content : h('div', {}, [header(settingsData), content]),
            name === 'footer' ? null : footer(footerData || {})
          ])
        ]);
      },
      getInitialState: function () {
        return { settings: null, footer: null };
      },
      componentDidMount: function () {
        const settingsRequest = name === 'settings' ? Promise.resolve(null) : loadContent('settings');
        const footerRequest = name === 'footer' ? Promise.resolve(null) : loadContent('footer');
        Promise.all([settingsRequest, footerRequest]).then(([settingsData, footerData]) => {
          this.setState({ settings: settingsData, footer: footerData });
        }).catch(error => {
          console.error('CMS preview could not load the saved site header or footer.', error);
        });
      }
    });
    cms.registerPreviewTemplate(name, Preview);
  });
})();
