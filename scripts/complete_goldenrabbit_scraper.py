import requests
from bs4 import BeautifulSoup
import json
import time
import random
from datetime import datetime
import re
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service


class GoldenRabbitCompleteScraper:
    def __init__(self):
        self.books_data = {}
        self.book_count = 0
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
            'Connection': 'keep-alive',
        })
    
    def setup_selenium_driver(self):
        """Selenium WebDriver 설정"""
        chrome_options = Options()
        chrome_options.add_argument('--headless')  # 브라우저 창 숨기기
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        
        try:
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=chrome_options)
            return driver
        except Exception as e:
            print(f"❌ Chrome WebDriver 설정 실패: {e}")
            print("📝 Chrome이 설치되어 있는지 확인해주세요.")
            return None
    
    def load_all_books_with_selenium(self):
        """Selenium으로 모든 도서 로드 (Load More 버튼 클릭)"""
        print("🚀 Selenium으로 모든 도서 로드 시작...")
        
        driver = self.setup_selenium_driver()
        if not driver:
            return []
        
        try:
            url = "https://goldenrabbit.co.kr/product-category/books/"
            print(f"📚 페이지 로드: {url}")
            driver.get(url)
            
            # 페이지 로딩 대기
            time.sleep(3)
            
            # Load More 버튼을 계속 클릭
            load_more_clicks = 0
            max_clicks = 10  # 최대 10번까지만 클릭
            
            while load_more_clicks < max_clicks:
                try:
                    # Load More 버튼 찾기
                    load_more_selectors = [
                        "a.thb_load_more.button",
                        ".thb_load_more",
                        "a[class*='load_more']",
                        "a[class*='thb_load_more']"
                    ]
                    
                    load_more_button = None
                    for selector in load_more_selectors:
                        try:
                            load_more_button = WebDriverWait(driver, 5).until(
                                EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                            )
                            break
                        except TimeoutException:
                            continue
                    
                    if not load_more_button:
                        print("🏁 Load More 버튼을 찾을 수 없습니다. 모든 도서가 로드된 것 같습니다.")
                        break
                    
                    # 버튼 텍스트 확인
                    button_text = load_more_button.text.strip()
                    print(f"🔍 버튼 텍스트: '{button_text}'")
                    
                    if 'Loading' in button_text or button_text == '':
                        print("⏳ 아직 로딩 중이거나 비활성 상태입니다. 잠시 대기...")
                        time.sleep(2)
                        continue
                    
                    # 버튼 클릭 전 현재 도서 수 체크
                    current_books = driver.find_elements(By.CSS_SELECTOR, "ul.products li.product")
                    books_before = len(current_books)
                    print(f"📖 클릭 전 도서 수: {books_before}")
                    
                    # Load More 버튼 클릭
                    driver.execute_script("arguments[0].click();", load_more_button)
                    load_more_clicks += 1
                    print(f"🖱️ Load More 버튼 클릭 #{load_more_clicks}")
                    
                    # 로딩 대기
                    time.sleep(3)
                    
                    # 새로운 도서가 로드되었는지 확인
                    current_books = driver.find_elements(By.CSS_SELECTOR, "ul.products li.product")
                    books_after = len(current_books)
                    print(f"📖 클릭 후 도서 수: {books_after}")
                    
                    if books_after <= books_before:
                        print("🏁 더 이상 새로운 도서가 로드되지 않습니다.")
                        break
                    
                    print(f"✅ {books_after - books_before}개의 새로운 도서가 로드되었습니다.")
                    
                except TimeoutException:
                    print("🏁 Load More 버튼이 더 이상 없습니다. 모든 도서가 로드된 것 같습니다.")
                    break
                except Exception as e:
                    print(f"⚠️ Load More 클릭 중 오류: {e}")
                    break
            
            # 최종 도서 링크들 수집
            print("\n📋 모든 도서 링크 수집 중...")
            
            book_links = []
            book_elements = driver.find_elements(By.CSS_SELECTOR, "ul.products li.product h3 a")
            
            for element in book_elements:
                try:
                    title = element.text.strip()
                    url = element.get_attribute('href')
                    if title and url:
                        book_links.append({
                            'title': title,
                            'url': url
                        })
                except Exception as e:
                    print(f"⚠️ 도서 링크 추출 오류: {e}")
            
            print(f"🎉 총 {len(book_links)}개의 도서 링크를 수집했습니다!")
            return book_links
            
        except Exception as e:
            print(f"❌ Selenium 실행 중 오류: {e}")
            return []
        finally:
            driver.quit()
    
    def clean_text(self, text):
        """텍스트 정리"""
        if not text:
            return ""
        return re.sub(r'\s+', ' ', text).strip()
    
    def extract_book_detail(self, book_url, book_title):
        """도서 상세 페이지에서 모든 정보 추출"""
        try:
            print(f"\n📖 도서 상세 정보 추출: {book_title}")
            print(f"🔗 URL: {book_url}")
            
            # Rate limiting
            time.sleep(random.uniform(2.0, 3.0))
            
            response = self.session.get(book_url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 기본 정보 추출
            book_data = {
                'title': book_title,
                'url': book_url,
                'author': '',
                'publisher': '골든래빗',
                'publication_date': '',
                'price': '',
                'isbn': '',
                'page_count': '',
                'description': '',
                'table_of_contents': '',
                'publisher_review': '',
                'testimonials': '',
                'cover_image_url': '',
                'category': 'IT전문서'
            }
            
            # 가격 정보
            price_selectors = [
                '.price .woocommerce-Price-amount.amount',
                '.price .amount',
                'span.price .amount',
                '.woocommerce-Price-amount',
            ]
            
            for selector in price_selectors:
                price_element = soup.select_one(selector)
                if price_element:
                    book_data['price'] = self.clean_text(price_element.get_text())
                    break
            
            # 상품 이미지
            image_selectors = [
                '.woocommerce-product-gallery__image img',
                '.product-image img',
                '.wp-post-image',
                'img[class*="attachment"]'
            ]
            
            for selector in image_selectors:
                img_element = soup.select_one(selector)
                if img_element:
                    src = img_element.get('src') or img_element.get('data-src')
                    if src:
                        book_data['cover_image_url'] = src
                        break
            
            # 상품 정보 테이블 또는 메타 정보에서 상세 정보 추출
            self.extract_product_meta_info(soup, book_data)
            
            # 상품 설명 섹션들 추출
            self.extract_product_descriptions(soup, book_data)
            
            # 탭 형태의 추가 정보 추출
            self.extract_tabbed_content(soup, book_data)
            
            print(f"✅ 추출 완료:")
            print(f"  - 저자: {book_data['author']}")
            print(f"  - 가격: {book_data['price']}")
            print(f"  - 출간일: {book_data['publication_date']}")
            print(f"  - ISBN: {book_data['isbn']}")
            print(f"  - 설명 길이: {len(book_data['description'])}자")
            print(f"  - 목차 길이: {len(book_data['table_of_contents'])}자")
            print(f"  - 출판사 리뷰 길이: {len(book_data['publisher_review'])}자")
            print(f"  - 추천평 길이: {len(book_data['testimonials'])}자")
            
            return book_data
            
        except Exception as e:
            print(f"❌ 상세 정보 추출 오류: {e}")
            return None
    
    def extract_product_meta_info(self, soup, book_data):
        """상품 메타 정보 추출 (저자, ISBN, 페이지 수 등)"""
        # 다양한 메타 정보 섹션 찾기
        meta_selectors = [
            '.product_meta',
            '.woocommerce-product-attributes',
            '.additional-information table',
            '.product-details',
            'table.shop_attributes'
        ]
        
        for meta_selector in meta_selectors:
            meta_section = soup.select_one(meta_selector)
            if meta_section:
                # 테이블 형태
                rows = meta_section.find_all('tr')
                for row in rows:
                    self.process_meta_row(row, book_data)
                
                # 정의 목록 형태 (dt, dd)
                dt_elements = meta_section.find_all('dt')
                dd_elements = meta_section.find_all('dd')
                for dt, dd in zip(dt_elements, dd_elements):
                    label = self.clean_text(dt.get_text()).lower()
                    value = self.clean_text(dd.get_text())
                    self.assign_meta_value(label, value, book_data)
                
                # span 형태 메타 정보
                spans = meta_section.find_all('span')
                for span in spans:
                    text = self.clean_text(span.get_text())
                    self.parse_meta_text(text, book_data)
    
    def process_meta_row(self, row, book_data):
        """테이블 행에서 메타 정보 처리"""
        th = row.find('th')
        td = row.find('td')
        
        if th and td:
            label = self.clean_text(th.get_text()).lower()
            value = self.clean_text(td.get_text())
            self.assign_meta_value(label, value, book_data)
    
    def assign_meta_value(self, label, value, book_data):
        """라벨에 따라 적절한 필드에 값 할당"""
        if not value:
            return
        
        if '저자' in label or 'author' in label:
            book_data['author'] = value
        elif 'isbn' in label:
            book_data['isbn'] = value
        elif '페이지' in label or 'page' in label:
            book_data['page_count'] = value
        elif '출간' in label or 'publish' in label or '발행' in label:
            book_data['publication_date'] = value
        elif '크기' in label or '판형' in label or 'size' in label:
            book_data['size'] = value
    
    def parse_meta_text(self, text, book_data):
        """일반 텍스트에서 메타 정보 파싱"""
        # "저자 : 홍길동" 형태
        if ':' in text:
            parts = text.split(':', 1)
            if len(parts) == 2:
                label = self.clean_text(parts[0]).lower()
                value = self.clean_text(parts[1])
                self.assign_meta_value(label, value, book_data)
    
    def extract_product_descriptions(self, soup, book_data):
        """상품 설명 섹션들 추출"""
        # 짧은 설명
        short_desc_selectors = [
            '.woocommerce-product-details__short-description',
            '.product-short-description',
            '.entry-summary .product-excerpt'
        ]
        
        for selector in short_desc_selectors:
            element = soup.select_one(selector)
            if element:
                text = self.clean_text(element.get_text())
                if text and len(text) > len(book_data['description']):
                    book_data['description'] = text
                break
    
    def extract_tabbed_content(self, soup, book_data):
        """탭 형태의 콘텐츠 추출 (설명, 목차, 리뷰 등)"""
        # WooCommerce 탭 구조
        tab_selectors = [
            '#tab-description',
            '#tab-reviews',
            '#tab-additional_information',
            '.woocommerce-Tabs-panel--description',
            '.woocommerce-Tabs-panel--additional_information',
            '.woocommerce-Tabs-panel--reviews'
        ]
        
        for selector in tab_selectors:
            tab_content = soup.select_one(selector)
            if tab_content:
                text = self.clean_text(tab_content.get_text())
                
                if 'description' in selector and text:
                    if len(text) > len(book_data['description']):
                        book_data['description'] = text
                elif 'review' in selector and text:
                    book_data['testimonials'] = text
        
        # 커스텀 탭들 찾기
        self.extract_custom_tabs(soup, book_data)
    
    def extract_custom_tabs(self, soup, book_data):
        """커스텀 탭 또는 아코디언 형태의 콘텐츠 추출"""
        # 한국어 키워드로 섹션 찾기
        keywords_map = {
            '목차': 'table_of_contents',
            '차례': 'table_of_contents',
            '출판사': 'publisher_review',
            '출판사리뷰': 'publisher_review',
            '출판사 리뷰': 'publisher_review',
            '추천': 'testimonials',
            '추천평': 'testimonials',
            '서평': 'testimonials',
            '리뷰': 'testimonials',
            '책소개': 'description',
            '내용': 'description',
            '소개': 'description'
        }
        
        # 헤딩 태그들 확인
        headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        for heading in headings:
            heading_text = self.clean_text(heading.get_text()).lower()
            
            for keyword, field in keywords_map.items():
                if keyword in heading_text:
                    # 헤딩 다음의 콘텐츠 찾기
                    content = self.get_content_after_heading(heading)
                    if content and len(content) > len(book_data.get(field, '')):
                        book_data[field] = content
                    break
        
        # div 클래스명으로 찾기
        div_classes = soup.find_all('div', class_=True)
        for div in div_classes:
            class_text = ' '.join(div.get('class', [])).lower()
            
            for keyword, field in keywords_map.items():
                if keyword in class_text:
                    content = self.clean_text(div.get_text())
                    if content and len(content) > len(book_data.get(field, '')):
                        book_data[field] = content
                    break
    
    def get_content_after_heading(self, heading):
        """헤딩 태그 다음의 콘텐츠 추출"""
        content_parts = []
        current = heading.next_sibling
        
        while current and len(content_parts) < 5:  # 최대 5개 요소까지
            if hasattr(current, 'get_text'):
                text = self.clean_text(current.get_text())
                if text:
                    content_parts.append(text)
            elif isinstance(current, str):
                text = self.clean_text(current)
                if text:
                    content_parts.append(text)
            
            current = current.next_sibling
            
            # 다른 헤딩을 만나면 중단
            if current and hasattr(current, 'name') and current.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                break
        
        return ' '.join(content_parts)
    
    def scrape_all_books(self):
        """모든 도서 정보 스크래핑"""
        print("🚀 골든래빗 완전 스크래핑 시작!")
        print("="*60)
        
        # 1. Selenium으로 모든 도서 링크 수집
        book_links = self.load_all_books_with_selenium()
        
        if not book_links:
            print("❌ 도서 링크를 수집할 수 없습니다.")
            return
        
        print(f"\n📚 총 {len(book_links)}개 도서의 상세 정보를 추출합니다...")
        print("="*60)
        
        # 2. 각 도서의 상세 정보 추출
        for i, book in enumerate(book_links, 1):
            try:
                print(f"\n[{i}/{len(book_links)}] 진행률: {i/len(book_links)*100:.1f}%")
                
                book_data = self.extract_book_detail(book['url'], book['title'])
                
                if book_data:
                    self.book_count += 1
                    self.books_data[f"book_{self.book_count}"] = book_data
                    print(f"✅ 성공: {book_data['title']}")
                else:
                    print(f"❌ 실패: {book['title']}")
                    
            except Exception as e:
                print(f"❌ 오류 ({book['title']}): {e}")
        
        # 3. 결과 저장
        self.save_results()
    
    def save_results(self):
        """결과를 JSON 파일로 저장"""
        if not self.books_data:
            print("❌ 저장할 데이터가 없습니다.")
            return
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"complete_goldenrabbit_books_{timestamp}.json"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(self.books_data, f, ensure_ascii=False, indent=2)
            
            print(f"\n🎉 스크래핑 완료!")
            print(f"📊 총 {len(self.books_data)}개의 도서 정보를 수집했습니다.")
            print(f"💾 결과가 {filename}에 저장되었습니다.")
            
            # 통계 출력
            self.print_statistics()
            
        except Exception as e:
            print(f"❌ 파일 저장 오류: {e}")
    
    def print_statistics(self):
        """수집 통계 출력"""
        if not self.books_data:
            return
        
        print(f"\n📈 수집 통계:")
        
        # 기본 통계
        total_books = len(self.books_data)
        books_with_author = sum(1 for book in self.books_data.values() if book.get('author'))
        books_with_price = sum(1 for book in self.books_data.values() if book.get('price'))
        books_with_isbn = sum(1 for book in self.books_data.values() if book.get('isbn'))
        books_with_description = sum(1 for book in self.books_data.values() if book.get('description'))
        books_with_toc = sum(1 for book in self.books_data.values() if book.get('table_of_contents'))
        books_with_review = sum(1 for book in self.books_data.values() if book.get('publisher_review'))
        books_with_testimonials = sum(1 for book in self.books_data.values() if book.get('testimonials'))
        
        print(f"  - 총 도서 수: {total_books}")
        print(f"  - 저자 정보: {books_with_author}/{total_books} ({books_with_author/total_books*100:.1f}%)")
        print(f"  - 가격 정보: {books_with_price}/{total_books} ({books_with_price/total_books*100:.1f}%)")
        print(f"  - ISBN 정보: {books_with_isbn}/{total_books} ({books_with_isbn/total_books*100:.1f}%)")
        print(f"  - 책 소개: {books_with_description}/{total_books} ({books_with_description/total_books*100:.1f}%)")
        print(f"  - 목차: {books_with_toc}/{total_books} ({books_with_toc/total_books*100:.1f}%)")
        print(f"  - 출판사 리뷰: {books_with_review}/{total_books} ({books_with_review/total_books*100:.1f}%)")
        print(f"  - 추천평: {books_with_testimonials}/{total_books} ({books_with_testimonials/total_books*100:.1f}%)")


def main():
    """메인 실행 함수"""
    scraper = GoldenRabbitCompleteScraper()
    scraper.scrape_all_books()


if __name__ == "__main__":
    main()