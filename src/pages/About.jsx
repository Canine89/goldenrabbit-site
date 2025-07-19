import React from 'react'
import { Link } from 'react-router-dom'
import Container from '../components/ui/Container'
import Section from '../components/ui/Section'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

const About = () => {
  // 주요 도서 시리즈 데이터
  const bookSeries = [
    {
      id: 'must-have',
      name: 'Must Have',
      icon: 'M',
      color: 'bg-blue-500',
      description: '특정 기술에 대한 심도 있는 학습을 위한 시리즈',
      badge: 'primary'
    },
    {
      id: 'principle',
      name: '원칙',
      icon: '원',
      color: 'bg-amber-600',
      description: '시대를 넘나드는 비즈니스 통찰을 제공하는 시리즈',
      badge: 'secondary'
    },
    {
      id: 'becoming',
      name: '되기',
      icon: '되',
      color: 'bg-yellow-400',
      description: '실용적인 스킬 개발을 위한 실전 가이드',
      badge: 'warning'
    },
    {
      id: 'learning-toon',
      name: '잡학툰',
      icon: '잡',
      color: 'bg-amber-600',
      description: '성인을 위한 학습 만화 시리즈',
      badge: 'success'
    }
  ]

  // 주요 성과 데이터
  const achievements = [
    {
      number: '4권',
      description: '세종도서 학술부문 선정',
      color: 'text-secondary-500'
    },
    {
      number: '1위',
      description: 'Node.js, Spring Boot, Flutter, Go, JSP 분야 베스트셀러',
      color: 'text-blue-500'
    },
    {
      number: '2024',
      description: '"좋은여름" 에세이 브랜드 런칭',
      color: 'text-primary-500'
    }
  ]

  // 연혁 데이터
  const timeline = [
    {
      year: '2024',
      title: '"좋은여름" 에세이 브랜드 런칭',
      description: '성장 지향적 에세이 브랜드 시작',
      color: 'bg-primary-500'
    },
    {
      year: '2022',
      title: '패스트캠퍼스와 업무협약(MOU) 체결',
      description: '교육 콘텐츠 협력 강화',
      color: 'bg-blue-500'
    },
    {
      year: '2020',
      title: '골든래빗 설립',
      description: 'IT 전문 출판사로 새로운 시작',
      color: 'bg-secondary-500'
    }
  ]

  // 출간 분야 데이터
  const categories = [
    {
      name: 'IT 전문서',
      icon: '💻',
      description: '프로그래밍, 개발, 인공지능 등 IT 기술 전문서',
      color: 'bg-blue-500'
    },
    {
      name: 'IT 활용서',
      icon: '📱',
      description: '실무에 바로 적용할 수 있는 IT 활용 가이드',
      color: 'bg-secondary-500'
    },
    {
      name: '경제경영',
      icon: '📊',
      description: '비즈니스 전략, 창업, 경영 관련 실무서',
      color: 'bg-primary-500'
    }
  ]

  return (
    <div className="bg-neutral-50 min-h-screen">
      {/* 헤더 섹션 */}
      <Section background="gradient" padding="xl">
        <Container>
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white drop-shadow-lg">
              골든래빗 소개
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 max-w-4xl mx-auto leading-relaxed">
              모두의 가치가 성장하는 시간을 만듭니다
            </p>
          </div>
        </Container>
      </Section>

      {/* 미션 섹션 */}
      <Section background="white" padding="default">
        <Container>
          <Section.Header 
            title="우리의 미션"
            description="골든래빗은 개인과 전문가의 성장을 돕는 양질의 도서를 출간하는 것을 목표로 합니다. IT, 모바일, 경영 분야의 전문 지식을 쉽고 실용적으로 전달하여 독자들의 가치 성장을 지원합니다."
            titleClassName="text-neutral-900"
            descriptionClassName="text-neutral-600 text-lg leading-relaxed"
          />
        </Container>
      </Section>

      {/* 주요 도서 시리즈 섹션 */}
      <Section background="neutral" padding="default">
        <Container>
          <Section.Header 
            title="주요 도서 시리즈"
            description="골든래빗의 대표적인 도서 브랜드를 소개합니다"
            titleClassName="text-neutral-900"
            descriptionClassName="text-neutral-600"
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bookSeries.map((series) => (
              <Card 
                key={series.id}
                hover={true}
                className="text-center group"
              >
                <div className={`w-16 h-16 ${series.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <span className="text-white text-xl font-bold">
                    {series.icon}
                  </span>
                </div>
                <Card.Title className="mb-3 group-hover:text-primary-500 transition-colors">
                  {series.name}
                </Card.Title>
                <Card.Description className="text-sm">
                  {series.description}
                </Card.Description>
                <Card.Footer>
                  <Badge variant={series.badge} size="sm" className="mx-auto">
                    시리즈
                  </Badge>
                </Card.Footer>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* 성과 및 업적 섹션 */}
      <Section background="white" padding="default">
        <Container>
          <Section.Header 
            title="주요 성과"
            description="골든래빗이 이루어낸 의미 있는 성과들을 소개합니다"
            titleClassName="text-neutral-900"
            descriptionClassName="text-neutral-600"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {achievements.map((achievement, index) => (
              <Card 
                key={index}
                variant="gradient"
                className="text-center group hover:shadow-lg transition-all duration-300"
              >
                <div className="relative">
                  <div className={`text-4xl md:text-5xl font-bold mb-4 ${achievement.color}`}>
                    {achievement.number}
                  </div>
                  <Card.Description className="text-neutral-700 leading-relaxed">
                    {achievement.description}
                  </Card.Description>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* 연혁 섹션 */}
      <Section background="gradient-subtle" padding="default">
        <Container>
          <Section.Header 
            title="연혁"
            description="골든래빗의 성장 여정을 함께 살펴보세요"
            titleClassName="text-neutral-900"
            descriptionClassName="text-neutral-600"
          />
          
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* 타임라인 선 */}
              <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-neutral-300"></div>
              
              <div className="space-y-12">
                {timeline.map((item, index) => (
                  <div key={index} className="relative flex items-start">
                    {/* 연도 원 */}
                    <div className={`w-16 h-16 ${item.color} rounded-full flex items-center justify-center text-white font-bold text-sm mr-8 flex-shrink-0 shadow-lg`}>
                      {item.year}
                    </div>
                    
                    {/* 내용 카드 */}
                    <Card className="flex-1" hover={true}>
                      <Card.Title className="mb-2 text-neutral-900">
                        {item.title}
                      </Card.Title>
                      <Card.Description>
                        {item.description}
                      </Card.Description>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* 출간 분야 섹션 */}
      <Section background="white" padding="default">
        <Container>
          <Section.Header 
            title="출간 분야"
            description="골든래빗이 전문성을 갖고 있는 주요 출간 분야를 소개합니다"
            titleClassName="text-neutral-900"
            descriptionClassName="text-neutral-600"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <Card 
                key={index}
                hover={true}
                className="text-center group"
                as={Link}
                to="/books"
              >
                <div className={`w-20 h-20 ${category.color} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
                  <span className="text-3xl">
                    {category.icon}
                  </span>
                </div>
                <Card.Title className="mb-3 group-hover:text-primary-500 transition-colors">
                  {category.name}
                </Card.Title>
                <Card.Description>
                  {category.description}
                </Card.Description>
                <Card.Footer>
                  <Button variant="ghost" size="sm" className="mx-auto mt-4">
                    도서 보기
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </Card.Footer>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA 섹션 */}
      <Section background="primary" padding="default">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-white">
              함께 성장해요
            </h2>
            <p className="text-xl mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
              골든래빗과 함께 여러분의 가치 성장을 위한 여정을 시작하세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
              <Button
                as={Link}
                to="/author-apply"
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto shadow-lg hover:shadow-xl"
              >
                저자 신청하기
              </Button>
              <Button
                as={Link}
                to="/professor"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-primary-600 shadow-lg font-semibold"
              >
                교수회원 신청
              </Button>
              <Button
                as={Link}
                to="/contact"
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto text-white hover:bg-white/10 shadow-lg"
              >
                도서 제안하기
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  )
}

export default About